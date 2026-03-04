/**
 * This file was @generated using pocketbase-typegen
 */

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export const Collections = {
  About: 'About',
  Homepage: 'Homepage',
  PortfolioProjects: 'Portfolio_Projects',
  Settings: 'Settings',
  Authorigins: '_authOrigins',
  Externalauths: '_externalAuths',
  Mfas: '_mfas',
  Otps: '_otps',
  Superusers: '_superusers',
  Users: 'users',
} as const

export type CollectionName = (typeof Collections)[keyof typeof Collections]

// Alias types for improved usability
export type IsoDateString = string
export type IsoAutoDateString = string & { readonly autodate: unique symbol }
export type RecordIdString = string
export type FileNameString = string & { readonly filename: unique symbol }
export type HTMLString = string

type ExpandType<T> = unknown extends T
  ? T extends unknown
    ? { expand?: unknown }
    : { expand: T }
  : { expand: T }

// System fields
export type BaseSystemFields<T = unknown> = {
  id: RecordIdString
  collectionId: string
  collectionName: CollectionName
} & ExpandType<T>

export type AuthSystemFields<T = unknown> = {
  email: string
  emailVisibility: boolean
  username: string
  verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export interface AboutRecord<TClient_List_Json = unknown> {
  About_Description?: string
  Client_List_Json?: null | TClient_List_Json
  Contact_Email?: string
  Contact_Message?: HTMLString
  Expertise_Description?: string
  Expertise_Title?: string
  Is_Active?: boolean
  Portfolio_Title?: string
  Selected_Clients_Title?: string
  created: IsoAutoDateString
  id: string
  updated: IsoAutoDateString
}

export interface HomepageRecord {
  Hero_Image?: FileNameString
  Hero_Image_Mobile?: FileNameString
  Hero_Title?: string
  Is_Active?: boolean
  created: IsoAutoDateString
  id: string
  updated: IsoAutoDateString
}

export interface PortfolioProjectsRecord<TResponsibility_json = unknown> {
  Description?: string
  Images?: FileNameString[]
  Order?: number
  Responsibility_json?: null | TResponsibility_json
  Title?: string
  created: IsoAutoDateString
  id: string
  updated: IsoAutoDateString
}

export interface SettingsRecord {
  data_version?: number
  Desktop_Font_Size?: number
  Large_Desktop_Font_Size?: number
  Mobile_Font_Size?: number
  Show_Top_Progress_Bar?: boolean
  Tablet_Font_Size?: number
  created: IsoAutoDateString
  favicon?: FileNameString
  id: string
  updated: IsoAutoDateString
}

export interface AuthoriginsRecord {
  collectionRef: string
  created: IsoAutoDateString
  fingerprint: string
  id: string
  recordRef: string
  updated: IsoAutoDateString
}

export interface ExternalauthsRecord {
  collectionRef: string
  created: IsoAutoDateString
  id: string
  provider: string
  providerId: string
  recordRef: string
  updated: IsoAutoDateString
}

export interface MfasRecord {
  collectionRef: string
  created: IsoAutoDateString
  id: string
  method: string
  recordRef: string
  updated: IsoAutoDateString
}

export interface OtpsRecord {
  collectionRef: string
  created: IsoAutoDateString
  id: string
  password: string
  recordRef: string
  sentTo?: string
  updated: IsoAutoDateString
}

export interface SuperusersRecord {
  created: IsoAutoDateString
  email: string
  emailVisibility?: boolean
  id: string
  password: string
  tokenKey: string
  updated: IsoAutoDateString
  verified?: boolean
}

export interface UsersRecord {
  avatar?: FileNameString
  created: IsoAutoDateString
  email: string
  emailVisibility?: boolean
  id: string
  name?: string
  password: string
  tokenKey: string
  updated: IsoAutoDateString
  verified?: boolean
}

// Response types include system fields and match responses from the PocketBase API
export type AboutResponse<
  TClient_List_Json = unknown,
  Texpand = unknown,
> = Required<AboutRecord<TClient_List_Json>> & BaseSystemFields<Texpand>
export type HomepageResponse<Texpand = unknown> = Required<HomepageRecord>
  & BaseSystemFields<Texpand>
export type PortfolioProjectsResponse<
  TResponsibility_json = unknown,
  Texpand = unknown,
> = Required<PortfolioProjectsRecord<TResponsibility_json>>
  & BaseSystemFields<Texpand>
export type SettingsResponse<Texpand = unknown> = Required<SettingsRecord>
  & BaseSystemFields<Texpand>
export type AuthoriginsResponse<Texpand = unknown>
  = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown>
  = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord>
  & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord>
  & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord>
  & AuthSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord>
  & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export interface CollectionRecords {
  About: AboutRecord
  Homepage: HomepageRecord
  Portfolio_Projects: PortfolioProjectsRecord
  Settings: SettingsRecord
  _authOrigins: AuthoriginsRecord
  _externalAuths: ExternalauthsRecord
  _mfas: MfasRecord
  _otps: OtpsRecord
  _superusers: SuperusersRecord
  users: UsersRecord
}

export interface CollectionResponses {
  About: AboutResponse
  Homepage: HomepageResponse
  Portfolio_Projects: PortfolioProjectsResponse
  Settings: SettingsResponse
  _authOrigins: AuthoriginsResponse
  _externalAuths: ExternalauthsResponse
  _mfas: MfasResponse
  _otps: OtpsResponse
  _superusers: SuperusersResponse
  users: UsersResponse
}

// Utility types for create/update operations

type ProcessCreateAndUpdateFields<T> = Omit<
  {
    // Omit AutoDate fields
    [K in keyof T as Extract<T[K], IsoAutoDateString> extends never
      ? K
      : never]: T[K] extends infer U // Convert FileNameString to File
      ? U extends FileNameString | FileNameString[]
        ? U extends any[]
          ? File[]
          : File
        : U
      : never
  },
  'id'
>

// Create type for Auth collections
export type CreateAuth<T> = {
  id?: RecordIdString
  email: string
  emailVisibility?: boolean
  password: string
  passwordConfirm: string
  verified?: boolean
} & ProcessCreateAndUpdateFields<T>

// Create type for Base collections
export type CreateBase<T> = {
  id?: RecordIdString
} & ProcessCreateAndUpdateFields<T>

// Update type for Auth collections
export type UpdateAuth<T> = Partial<
  Omit<ProcessCreateAndUpdateFields<T>, keyof AuthSystemFields>
> & {
  email?: string
  emailVisibility?: boolean
  oldPassword?: string
  password?: string
  passwordConfirm?: string
  verified?: boolean
}

// Update type for Base collections
export type UpdateBase<T> = Partial<
  Omit<ProcessCreateAndUpdateFields<T>, keyof BaseSystemFields>
>

// Get the correct create type for any collection
export type Create<T extends keyof CollectionResponses>
  = CollectionResponses[T] extends AuthSystemFields
    ? CreateAuth<CollectionRecords[T]>
    : CreateBase<CollectionRecords[T]>

// Get the correct update type for any collection
export type Update<T extends keyof CollectionResponses>
  = CollectionResponses[T] extends AuthSystemFields
    ? UpdateAuth<CollectionRecords[T]>
    : UpdateBase<CollectionRecords[T]>

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = {
  collection: <T extends keyof CollectionResponses>(
    idOrName: T,
  ) => RecordService<CollectionResponses[T]>
} & PocketBase
