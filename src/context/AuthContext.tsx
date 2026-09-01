import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import type { Session } from '@supabase/supabase-js'

import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase'

import { getMyProfile } from '../services/api'

import type { Profile } from '../types/domain'

import {
  AuthContext,
  type AuthState,
} from './auth-context'

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [session, setSession] =
    useState<Session | null>(null)

  const [profile, setProfile] =
    useState<Profile | null>(null)

  /*
    loading agora representa SOMENTE a inicialização
    da autenticação.

    Uma renovação de token não desmontará mais
    a aplicação inteira.
  */
  const [loading, setLoading] =
    useState(true)

  const [
    profileError,
    setProfileError,
  ] = useState<string | null>(
    null,
  )

  /*
    Mantemos a sessão atual também em ref para
    poder comparar sem depender de closures antigas.
  */
  const sessionRef =
    useRef<Session | null>(
      null,
    )

  /*
    Indica se a primeira inicialização já terminou.
  */
  const initializedRef =
    useRef(false)

  const loadProfile =
    useCallback(
      async (
        nextSession:
          | Session
          | null,
        showGlobalLoading = false,
      ) => {
        sessionRef.current =
          nextSession

        setSession(
          nextSession,
        )

        setProfileError(
          null,
        )

        if (!nextSession) {
          setProfile(null)

          if (
            showGlobalLoading
          ) {
            setLoading(
              false,
            )
          }

          return
        }

        /*
          Só mostramos loading global quando realmente
          necessário, principalmente na inicialização.

          Refresh de token em segundo plano NÃO desmonta
          mais as páginas.
        */
        if (
          showGlobalLoading
        ) {
          setLoading(true)
        }

        try {
          const loadedProfile =
            await getMyProfile(
              nextSession
                .user.id,
            )

          setProfile(
            loadedProfile,
          )
        } catch (
          error
        ) {
          console.error(
            'Erro ao carregar perfil:',
            error,
          )

          setProfile(
            null,
          )

          setProfileError(
            error instanceof
              Error
              ? error.message
              : 'Não foi possível carregar o perfil do usuário.',
          )
        } finally {
          if (
            showGlobalLoading
          ) {
            setLoading(
              false,
            )
          }
        }
      },
      [],
    )

  useEffect(() => {
    if (
      !isSupabaseConfigured ||
      !supabase
    ) {
      setLoading(false)
      initializedRef.current =
        true

      return
    }

    const client =
      supabase

    let mounted = true

    async function initializeAuth() {
      try {
        const {
          data,
          error,
        } =
          await client.auth.getSession()

        if (error) {
          throw error
        }

        if (!mounted) {
          return
        }

        /*
          Esta é a única situação normal em que
          precisamos bloquear a aplicação com loading.
        */
        await loadProfile(
          data.session,
          true,
        )
      } catch (
        error
      ) {
        console.error(
          'Erro ao inicializar autenticação:',
          error,
        )

        if (
          mounted
        ) {
          sessionRef.current =
            null

          setSession(
            null,
          )

          setProfile(
            null,
          )

          setProfileError(
            error instanceof
              Error
              ? error.message
              : 'Não foi possível inicializar a autenticação.',
          )

          setLoading(
            false,
          )
        }
      } finally {
        initializedRef.current =
          true
      }
    }

    void initializeAuth()

    const {
      data: {
        subscription,
      },
    } =
      client.auth.onAuthStateChange(
        (
          event,
          nextSession,
        ) => {
          if (
            !mounted
          ) {
            return
          }

          /*
            Logout:
            pode limpar imediatamente tudo.
          */
          if (
            event ===
            'SIGNED_OUT'
          ) {
            sessionRef.current =
              null

            setSession(
              null,
            )

            setProfile(
              null,
            )

            setProfileError(
              null,
            )

            return
          }

          /*
            Renovação automática do token.

            IMPORTANTE:
            não ativamos loading global aqui.

            Portanto:
            - não desmonta a rota;
            - não perde formulário;
            - não fecha modal;
            - não perde dados digitados.
          */
          if (
            event ===
              'TOKEN_REFRESHED' ||
            event ===
              'USER_UPDATED'
          ) {
            if (
              nextSession
            ) {
              void loadProfile(
                nextSession,
                false,
              )
            }

            return
          }

          /*
            Login real.

            Se a aplicação já tiver sido inicializada,
            carregamos o perfil sem desmontar tudo.

            Na tela de login isso é suficiente para
            permitir o redirecionamento normalmente.
          */
          if (
            event ===
            'SIGNED_IN'
          ) {
            if (
              nextSession
            ) {
              const previousUserId =
                sessionRef.current
                  ?.user.id

              const newUserId =
                nextSession
                  .user.id

              /*
                Usuário realmente mudou:
                carregamos normalmente.

                Não usamos loading global após
                a inicialização porque isso evitará
                desmontagens desnecessárias.
              */
              if (
                previousUserId !==
                newUserId
              ) {
                setProfile(
                  null,
                )
              }

              void loadProfile(
                nextSession,
                false,
              )
            }

            return
          }

          /*
            Outros eventos do Supabase não devem
            desmontar a aplicação.
          */
          if (
            nextSession
          ) {
            sessionRef.current =
              nextSession

            setSession(
              nextSession,
            )
          }
        },
      )

    return () => {
      mounted = false

      subscription.unsubscribe()
    }
  }, [loadProfile])

  const refreshProfile =
    useCallback(
      async () => {
        const currentSession =
          sessionRef.current

        if (
          !currentSession
        ) {
          setProfile(
            null,
          )

          setProfileError(
            null,
          )

          return
        }

        setProfileError(
          null,
        )

        try {
          const loadedProfile =
            await getMyProfile(
              currentSession
                .user.id,
            )

          setProfile(
            loadedProfile,
          )
        } catch (
          error
        ) {
          console.error(
            'Erro ao atualizar perfil:',
            error,
          )

          setProfileError(
            error instanceof
              Error
              ? error.message
              : 'Não foi possível atualizar o perfil.',
          )

          throw error
        }
      },
      [],
    )

  const value =
    useMemo<AuthState>(
      () => ({
        session,
        profile,
        loading,
        profileError,
        refreshProfile,
      }),
      [
        session,
        profile,
        loading,
        profileError,
        refreshProfile,
      ],
    )

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}