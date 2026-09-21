"use client";

import { useCallback, useEffect, useState } from "react";

import { getStoredUser } from "@/lib/api-client";
import type { AuthUser } from "@/types/api";

export interface CachedList<T> {
  items: T[];
  loading: boolean;
  error: unknown;
  /** Re-fetches and pushes the new list to every mounted consumer. */
  refresh: () => Promise<void>;
}

/**
 * Uma entrada guardada entre recargas, com o instante em que foi buscada.
 * O carimbo existe para nunca pintar a tela com algo antigo demais.
 */
interface StoredEntry<T> {
  at: number;
  items: T[];
}

/**
 * Além deste tempo o que está guardado não é pintado — a tela mostra carregando
 * e espera o servidor.
 *
 * Uma hora é folgado de propósito: estas listas mudam uma vez por mês, e o
 * valor guardado só serve para a primeira pintura, porque a revalidação sai
 * sempre. O limite existe para o caso extremo de alguém voltar a uma aba
 * esquecida — aí é melhor esperar do que mostrar o mundo de ontem.
 */
const MAX_AGE_MS = 60 * 60 * 1000;

const KEY_PREFIX = "igreja.list";

/**
 * A congregação ATIVA entra na chave.
 *
 * Sem isso, um super admin que troca de congregação abriria a tela com os
 * cargos e departamentos da congregação anterior — o mesmo vazamento entre
 * congregações que a API inteira protege, reproduzido no navegador. A troca faz
 * recarga completa da página, então a memória do módulo zera; o que sobrevive é
 * exatamente isto aqui, e por isso é aqui que a chave precisa ser certa.
 */
function storageKey(name: string): string | null {
  const user = getStoredUser<AuthUser>();
  const congregationId = user?.congregation?.id;
  if (!congregationId) return null;
  return `${KEY_PREFIX}.${name}.${congregationId}`;
}

function readStored<T>(name: string): T[] | null {
  const key = storageKey(name);
  if (!key) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as StoredEntry<T>;
    if (!Array.isArray(entry.items)) return null;
    if (Date.now() - entry.at > MAX_AGE_MS) return null;
    return entry.items;
  } catch {
    // Aba anônima, armazenamento bloqueado ou JSON corrompido. Não há o que
    // avisar: sem cache a tela simplesmente busca do servidor, como antes.
    return null;
  }
}

function writeStored<T>(name: string, items: T[]): void {
  const key = storageKey(name);
  if (!key) return;
  try {
    const entry: StoredEntry<T> = { at: Date.now(), items };
    window.sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Cota estourada ou armazenamento bloqueado. Ignorar é correto: o cache é
    // conveniência, e falhar em guardá-lo não pode quebrar a tela.
  }
}

/** Chamado no logout: o próximo login pode ser de outra pessoa, nesta máquina. */
export function clearCachedLists(): void {
  try {
    const keys: string[] = [];
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(KEY_PREFIX)) keys.push(key);
    }
    for (const key of keys) window.sessionStorage.removeItem(key);
  } catch {
    // Mesmo motivo de sempre: sem armazenamento, não há o que limpar.
  }
}

/**
 * Hook sobre uma lista pequena e que muda pouco (os vocabulários da
 * congregação: tipos de culto, cargos, departamentos, origens, níveis).
 *
 * Duas camadas, com propósitos diferentes:
 *
 * 1. **Memória do módulo** — a lista é buscada uma vez e toda a tela reaproveita.
 *    Uma barra de filtro, um formulário e um gráfico deixam de disparar três
 *    requisições. Morre ao recarregar a página.
 *
 * 2. **sessionStorage** — sobrevive ao F5, que é o caso comum: a pessoa atualiza
 *    a tela e antes via três esqueletos girando de novo.
 *
 * A estratégia é **stale-while-revalidate**: pinta na hora com o que tem e vai
 * buscar do servidor em seguida, sempre. Ninguém fica olhando para dado velho —
 * só deixa de olhar para tela vazia enquanto o novo chega.
 *
 * `sessionStorage` e não `localStorage` de propósito: o cache morre ao fechar a
 * aba. Estas listas não são segredo, mas uma máquina compartilhada na secretaria
 * é o cenário real desta igreja, e não há motivo para a lista de alguém esperar
 * o logout para sumir.
 *
 * Deliberadamente não é uma biblioteca de cache: não há nenhuma instalada, e a
 * única invalidação que esta aplicação precisa é "Configurações acabou de mudar
 * a lista" — que é uma chamada explícita a `refresh`.
 */
export function createCachedList<T>(
  /** Nome estável, usado na chave de armazenamento. */
  name: string,
  fetcher: () => Promise<T[]>,
): {
  useList: () => CachedList<T>;
  refresh: () => Promise<void>;
} {
  let data: T[] | null = null;
  let error: unknown = null;
  let inFlight: Promise<void> | null = null;
  /** Se já tentamos ler o armazenamento nesta carga de página. */
  let hydrated = false;
  const listeners = new Set<() => void>();

  function notify(): void {
    for (const listener of listeners) listener();
  }

  /** Primeira pintura a partir do que sobreviveu à recarga. */
  function hydrate(): void {
    if (hydrated) return;
    hydrated = true;
    if (data !== null) return;
    const stored = readStored<T>(name);
    if (stored) data = stored;
  }

  function load(force: boolean): Promise<void> {
    // Sem `force`, uma busca em voo é reaproveitada — mas ter dado em mãos NÃO
    // cancela a revalidação: é justamente o "while-revalidate" da estratégia.
    if (inFlight && !force) return inFlight;

    const pending = fetcher()
      .then((items) => {
        data = items;
        error = null;
        writeStored(name, items);
      })
      .catch((err: unknown) => {
        // Com dado em mãos, o erro não derruba a tela: continua mostrando o que
        // tinha. Sem dado nenhum, o erro é o que a tela precisa exibir.
        if (data === null) error = err;
      })
      .finally(() => {
        inFlight = null;
        notify();
      });

    inFlight = pending;
    return pending;
  }

  function useList(): CachedList<T> {
    const [, setVersion] = useState(0);

    useEffect(() => {
      const listener = () => setVersion((current) => current + 1);
      listeners.add(listener);

      hydrate();
      // Revalida sempre, mesmo já tendo pintado: quem está na tela vê o dado
      // guardado imediatamente e o real logo em seguida.
      void load(false);

      return () => {
        listeners.delete(listener);
      };
    }, []);

    const refresh = useCallback(() => load(true), []);

    return {
      items: data ?? [],
      // Só é "carregando" quando não há absolutamente nada a mostrar. Com dado
      // guardado, a tela já está pintada e a revalidação é invisível.
      loading: data === null && error === null,
      error,
      refresh,
    };
  }

  return { useList, refresh: () => load(true) };
}
