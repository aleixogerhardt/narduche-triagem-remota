import { zodResolver } from '@hookform/resolvers/zod'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  Building2,
  Edit3,
  Plus,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import {
  Controller,
  useForm,
} from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import {
  Button,
  Card,
  DangerButton,
  EmptyState,
  Input,
  Label,
  Modal,
  PageHeader,
  SecondaryButton,
  Spinner,
} from '../components/ui'

import { friendlyError } from '../lib/utils'
import {
  deleteCompany,
  listCompanies,
  saveCompany,
} from '../services/api'

import type { Company } from '../types/domain'

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      'Informe o nome da empresa.',
    ),

  document: z
    .string()
    .refine(
      (value) =>
        value.length === 0 ||
        value.length === 14,
      'O CNPJ deve possuir 14 números.',
    )
    .optional(),

  contact_email: z
    .union([
      z.literal(''),
      z
        .string()
        .email(
          'Informe um e-mail válido.',
        ),
    ])
    .optional(),

  contact_phone: z
    .string()
    .refine(
      (value) =>
        value.length === 0 ||
        value.length === 10 ||
        value.length === 11,
      'O telefone deve possuir 10 ou 11 números.',
    )
    .optional(),

  active: z.boolean(),
})

type FormData = z.infer<
  typeof schema
>

const emptyCompany: FormData = {
  name: '',
  document: '',
  contact_email: '',
  contact_phone: '',
  active: true,
}

function onlyNumbers(
  value: string,
  maxLength: number,
) {
  return value
    .replace(/\D/g, '')
    .slice(0, maxLength)
}

function formatCnpj(
  value: string,
) {
  const numbers = onlyNumbers(
    value,
    14,
  )

  return numbers
    .replace(
      /^(\d{2})(\d)/,
      '$1.$2',
    )
    .replace(
      /^(\d{2})\.(\d{3})(\d)/,
      '$1.$2.$3',
    )
    .replace(
      /\.(\d{3})(\d)/,
      '.$1/$2',
    )
    .replace(
      /(\d{4})(\d)/,
      '$1-$2',
    )
}

function formatPhone(
  value: string,
) {
  const numbers = onlyNumbers(
    value,
    11,
  )

  if (numbers.length <= 10) {
    return numbers
      .replace(
        /^(\d{2})(\d)/,
        '($1) $2',
      )
      .replace(
        /(\d{4})(\d)/,
        '$1-$2',
      )
  }

  return numbers
    .replace(
      /^(\d{2})(\d)/,
      '($1) $2',
    )
    .replace(
      /(\d{5})(\d)/,
      '$1-$2',
    )
}

export function AdminCompaniesPage() {
  const queryClient =
    useQueryClient()

  const [
    open,
    setOpen,
  ] = useState(false)

  const [
    editing,
    setEditing,
  ] =
    useState<Company | null>(
      null,
    )

  const [
    companyToDelete,
    setCompanyToDelete,
  ] =
    useState<Company | null>(
      null,
    )

  const companiesQuery =
    useQuery({
      queryKey: [
        'companies',
      ],
      queryFn:
        listCompanies,
    })

  const form =
    useForm<FormData>({
      resolver:
        zodResolver(
          schema,
        ),

      defaultValues:
        emptyCompany,
    })

  function newCompany() {
    setEditing(null)

    form.reset(
      emptyCompany,
    )

    setOpen(true)
  }

  function editCompany(
    company: Company,
  ) {
    setEditing(company)

    form.reset({
      name:
        company.name,

      document:
        onlyNumbers(
          company.document ??
            '',
          14,
        ),

      contact_email:
        company.contact_email ??
        '',

      contact_phone:
        onlyNumbers(
          company.contact_phone ??
            '',
          11,
        ),

      active:
        company.active,
    })

    setOpen(true)
  }

  const saveMutation =
    useMutation({
      mutationFn: (
        values: FormData,
      ) =>
        saveCompany({
          ...values,

          document:
            values.document ||
            null,

          contact_phone:
            values.contact_phone ||
            null,

          contact_email:
            values.contact_email ||
            null,

          id:
            editing?.id,
        }),

      onSuccess:
        async () => {
          toast.success(
            editing
              ? 'Empresa atualizada com sucesso.'
              : 'Empresa cadastrada com sucesso.',
          )

          setOpen(false)

          setEditing(
            null,
          )

          form.reset(
            emptyCompany,
          )

          await queryClient.invalidateQueries(
            {
              queryKey: [
                'companies',
              ],
            },
          )
        },

      onError: (
        error,
      ) => {
        toast.error(
          friendlyError(
            error,
          ),
        )
      },
    })

  const deleteMutation =
    useMutation({
      mutationFn: (
        id: string,
      ) =>
        deleteCompany(id),

      onSuccess:
        async () => {
          toast.success(
            'Empresa excluída com sucesso.',
          )

          setCompanyToDelete(
            null,
          )

          await queryClient.invalidateQueries(
            {
              queryKey: [
                'companies',
              ],
            },
          )
        },

      onError: (
        error,
      ) => {
        toast.error(
          friendlyError(
            error,
          ),
        )
      },
    })

  if (
    companiesQuery.isLoading
  ) {
    return <Spinner />
  }

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Empresas"
        description="Cadastre e gerencie as organizações atendidas pela Narduche."
        action={
          <Button
            onClick={
              newCompany
            }
          >
            <Plus className="h-4 w-4" />

            Nova empresa
          </Button>
        }
      />

      <Card>
        {(companiesQuery.data
          ?.length ?? 0) ===
        0 ? (
          <EmptyState
            title="Nenhuma empresa"
            description="Cadastre a primeira organização cliente."
            icon={
              <Building2 className="h-5 w-5" />
            }
          />
        ) : (
          <div className="divide-y divide-slate-800">
            {companiesQuery.data!.map(
              (
                company,
              ) => (
                <div
                  key={
                    company.id
                  }
                  className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-100">
                        {
                          company.name
                        }
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          company.active
                            ? 'bg-emerald-400/10 text-emerald-300'
                            : 'bg-slate-600/15 text-slate-400'
                        }`}
                      >
                        {company.active
                          ? 'ATIVA'
                          : 'INATIVA'}
                      </span>
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {company.document
                        ? formatCnpj(
                            company.document,
                          )
                        : 'CNPJ não informado'}

                      {' · '}

                      {company.contact_phone
                        ? formatPhone(
                            company.contact_phone,
                          )
                        : 'Telefone não informado'}

                      {' · '}

                      {company.contact_email ||
                        'E-mail não informado'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <SecondaryButton
                      onClick={() =>
                        editCompany(
                          company,
                        )
                      }
                    >
                      <Edit3 className="h-4 w-4" />

                      Editar
                    </SecondaryButton>

                    <DangerButton
                      onClick={() =>
                        setCompanyToDelete(
                          company,
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />

                      Excluir
                    </DangerButton>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onOpenChange={
          setOpen
        }
        title={
          editing
            ? 'Editar empresa'
            : 'Cadastrar empresa'
        }
        description="O nome e o CNPJ devem ser únicos no sistema."
      >
        <form
          onSubmit={form.handleSubmit(
            (values) =>
              saveMutation.mutate(
                values,
              ),
          )}
          className="space-y-4"
        >
          <div>
            <Label>
              Nome
            </Label>

            <Input
              {...form.register(
                'name',
              )}
              placeholder="Ex.: Unimed"
              autoComplete="organization"
            />

            {form.formState
              .errors.name && (
              <p className="mt-1 text-xs text-red-300">
                {
                  form
                    .formState
                    .errors
                    .name
                    .message
                }
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>
                CNPJ
              </Label>

              <Controller
                control={
                  form.control
                }
                name="document"
                render={({
                  field,
                }) => (
                  <Input
                    value={formatCnpj(
                      field.value ??
                        '',
                    )}
                    onChange={(
                      event,
                    ) => {
                      field.onChange(
                        onlyNumbers(
                          event
                            .target
                            .value,
                          14,
                        ),
                      )
                    }}
                    onBlur={
                      field.onBlur
                    }
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    autoComplete="off"
                  />
                )}
              />

              {form.formState
                .errors
                .document && (
                <p className="mt-1 text-xs text-red-300">
                  {
                    form
                      .formState
                      .errors
                      .document
                      .message
                  }
                </p>
              )}
            </div>

            <div>
              <Label>
                Telefone
              </Label>

              <Controller
                control={
                  form.control
                }
                name="contact_phone"
                render={({
                  field,
                }) => (
                  <Input
                    value={formatPhone(
                      field.value ??
                        '',
                    )}
                    onChange={(
                      event,
                    ) => {
                      field.onChange(
                        onlyNumbers(
                          event
                            .target
                            .value,
                          11,
                        ),
                      )
                    }}
                    onBlur={
                      field.onBlur
                    }
                    inputMode="numeric"
                    placeholder="(24) 99999-9999"
                    autoComplete="tel"
                  />
                )}
              />

              {form.formState
                .errors
                .contact_phone && (
                <p className="mt-1 text-xs text-red-300">
                  {
                    form
                      .formState
                      .errors
                      .contact_phone
                      .message
                  }
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>
              E-mail de contato
            </Label>

            <Input
              type="email"
              {...form.register(
                'contact_email',
              )}
              placeholder="contato@empresa.com.br"
              autoComplete="email"
            />

            {form.formState
              .errors
              .contact_email && (
              <p className="mt-1 text-xs text-red-300">
                {
                  form
                    .formState
                    .errors
                    .contact_email
                    .message
                }
              </p>
            )}
          </div>

          <label className="flex items-center gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              {...form.register(
                'active',
              )}
              className="h-4 w-4 accent-indigo-500"
            />

            Empresa ativa
          </label>

          <Button
            type="submit"
            disabled={
              saveMutation.isPending
            }
            className="w-full"
          >
            {saveMutation.isPending
              ? 'Salvando...'
              : editing
                ? 'Salvar alterações'
                : 'Cadastrar empresa'}
          </Button>
        </form>
      </Modal>

      <Modal
        open={
          companyToDelete !==
          null
        }
        onOpenChange={(
          nextOpen,
        ) => {
          if (
            !nextOpen
          ) {
            setCompanyToDelete(
              null,
            )
          }
        }}
        title="Excluir empresa"
        description="Esta operação não poderá ser desfeita."
      >
        <div className="space-y-5">
          <p className="text-sm leading-6 text-slate-300">
            Deseja realmente excluir
            {' '}
            <strong className="text-white">
              {
                companyToDelete?.name
              }
            </strong>
            ?
          </p>

          <p className="text-xs leading-5 text-slate-500">
            Se a empresa já possuir usuários,
            impressoras, triagens ou chamados
            vinculados, o sistema não permitirá
            a exclusão para preservar o histórico.
            Nesse caso, desative a empresa em vez
            de excluí-la.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <SecondaryButton
              type="button"
              onClick={() =>
                setCompanyToDelete(
                  null,
                )
              }
              disabled={
                deleteMutation.isPending
              }
            >
              Cancelar
            </SecondaryButton>

            <DangerButton
              type="button"
              onClick={() => {
                if (
                  companyToDelete
                ) {
                  deleteMutation.mutate(
                    companyToDelete.id,
                  )
                }
              }}
              disabled={
                deleteMutation.isPending
              }
            >
              <Trash2 className="h-4 w-4" />

              {deleteMutation.isPending
                ? 'Excluindo...'
                : 'Excluir empresa'}
            </DangerButton>
          </div>
        </div>
      </Modal>
    </>
  )
}