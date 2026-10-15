
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "categorias": {
                  Row: {
                    "ambito": string,"color": string,"emoji": string,"id": string,"nombre": string,"orden": number
                  }
                  ComputedFields: never
                  Insert: {
                    "ambito"?: string,"color": string,"emoji": string,"id": string,"nombre": string,"orden"?: number
                  }
                  Update: {
                    "ambito"?: string,"color"?: string,"emoji"?: string,"id"?: string,"nombre"?: string,"orden"?: number
                  }
                  Relationships: [
                    
                  ]
                },"comentarios": {
                  Row: {
                    "autor_id": string,"creado_en": string,"editado_en": string | null,"id": string,"resena_id": string,"texto": string
                  }
                  ComputedFields: never
                  Insert: {
                    "autor_id": string,"creado_en"?: string,"editado_en"?: string | null,"id"?: string,"resena_id": string,"texto": string
                  }
                  Update: {
                    "autor_id"?: string,"creado_en"?: string,"editado_en"?: string | null,"id"?: string,"resena_id"?: string,"texto"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "comentarios_autor_id_fkey"
      columns: ["autor_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comentarios_resena_id_fkey"
      columns: ["resena_id"]
isOneToOne: false
      referencedRelation: "resenas"
      referencedColumns: ["id"]
    }
                  ]
                },"fotos": {
                  Row: {
                    "creado_en": string,"id": string,"path": string,"resena_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "creado_en"?: string,"id"?: string,"path": string,"resena_id": string
                  }
                  Update: {
                    "creado_en"?: string,"id"?: string,"path"?: string,"resena_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fotos_resena_id_fkey"
      columns: ["resena_id"]
isOneToOne: false
      referencedRelation: "resenas"
      referencedColumns: ["id"]
    }
                  ]
                },"grupos": {
                  Row: {
                    "creado_en": string,"id": string,"nombre": string
                  }
                  ComputedFields: never
                  Insert: {
                    "creado_en"?: string,"id"?: string,"nombre": string
                  }
                  Update: {
                    "creado_en"?: string,"id"?: string,"nombre"?: string
                  }
                  Relationships: [
                    
                  ]
                },"invitaciones": {
                  Row: {
                    "anulada": boolean,"codigo": string,"creado_en": string,"creado_por": string,"expira_en": string,"grupo_id": string,"usos": number
                  }
                  ComputedFields: never
                  Insert: {
                    "anulada"?: boolean,"codigo"?: string,"creado_en"?: string,"creado_por": string,"expira_en"?: string,"grupo_id": string,"usos"?: number
                  }
                  Update: {
                    "anulada"?: boolean,"codigo"?: string,"creado_en"?: string,"creado_por"?: string,"expira_en"?: string,"grupo_id"?: string,"usos"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitaciones_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invitaciones_grupo_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    }
                  ]
                },"invitados": {
                  Row: {
                    "creado_en": string,"email": string,"grupo_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "creado_en"?: string,"email": string,"grupo_id": string
                  }
                  Update: {
                    "creado_en"?: string,"email"?: string,"grupo_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitados_grupo_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    }
                  ]
                },"lugares": {
                  Row: {
                    "categoria_id": string,"creado_en": string,"creado_por": string,"direccion": string | null,"grupo_id": string,"id": string,"lat": number,"lng": number,"nombre": string,"precio": number | null,"proveedor": string | null,"ref_externa": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "categoria_id": string,"creado_en"?: string,"creado_por": string,"direccion"?: string | null,"grupo_id": string,"id"?: string,"lat": number,"lng": number,"nombre": string,"precio"?: number | null,"proveedor"?: string | null,"ref_externa"?: string | null
                  }
                  Update: {
                    "categoria_id"?: string,"creado_en"?: string,"creado_por"?: string,"direccion"?: string | null,"grupo_id"?: string,"id"?: string,"lat"?: number,"lng"?: number,"nombre"?: string,"precio"?: number | null,"proveedor"?: string | null,"ref_externa"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "lugares_categoria_id_fkey"
      columns: ["categoria_id"]
isOneToOne: false
      referencedRelation: "categorias"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lugares_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lugares_grupo_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    }
                  ]
                },"pendientes": {
                  Row: {
                    "creado_en": string,"lugar_id": string,"privado": boolean,"recomendado_por": string | null,"usuario_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "creado_en"?: string,"lugar_id": string,"privado"?: boolean,"recomendado_por"?: string | null,"usuario_id": string
                  }
                  Update: {
                    "creado_en"?: string,"lugar_id"?: string,"privado"?: boolean,"recomendado_por"?: string | null,"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "pendientes_lugar_id_fkey"
      columns: ["lugar_id"]
isOneToOne: false
      referencedRelation: "lugares"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pendientes_lugar_id_fkey"
      columns: ["lugar_id"]
isOneToOne: false
      referencedRelation: "lugares_resumen"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pendientes_recomendado_por_fkey"
      columns: ["recomendado_por"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pendientes_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    }
                  ]
                },"perfiles": {
                  Row: {
                    "avatar_url": string | null,"creado_en": string,"grupo_id": string,"id": string,"nombre": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"creado_en"?: string,"grupo_id": string,"id": string,"nombre": string
                  }
                  Update: {
                    "avatar_url"?: string | null,"creado_en"?: string,"grupo_id"?: string,"id"?: string,"nombre"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "perfiles_grupo_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    }
                  ]
                },"reacciones": {
                  Row: {
                    "creado_en": string,"emoji": string,"resena_id": string,"usuario_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "creado_en"?: string,"emoji": string,"resena_id": string,"usuario_id": string
                  }
                  Update: {
                    "creado_en"?: string,"emoji"?: string,"resena_id"?: string,"usuario_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reacciones_resena_id_fkey"
      columns: ["resena_id"]
isOneToOne: false
      referencedRelation: "resenas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reacciones_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    }
                  ]
                },"resena_tags": {
                  Row: {
                    "resena_id": string,"tag_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "resena_id": string,"tag_id": string
                  }
                  Update: {
                    "resena_id"?: string,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "resena_tags_resena_id_fkey"
      columns: ["resena_id"]
isOneToOne: false
      referencedRelation: "resenas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resena_tags_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id"]
    }
                  ]
                },"resenas": {
                  Row: {
                    "ambiente": number | null,"autor_id": string,"borrada_en": string | null,"calidad_precio": number | null,"comida": number | null,"creado_en": string,"editado_en": string | null,"general": number,"grupo_id": string,"id": string,"lugar_id": string,"nota": string | null,"plan": string | null,"privada": boolean,"servicio": number | null,"visitado_en": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ambiente"?: number | null,"autor_id": string,"borrada_en"?: string | null,"calidad_precio"?: number | null,"comida"?: number | null,"creado_en"?: string,"editado_en"?: string | null,"general": number,"grupo_id": string,"id"?: string,"lugar_id": string,"nota"?: string | null,"plan"?: string | null,"privada"?: boolean,"servicio"?: number | null,"visitado_en"?: string
                  }
                  Update: {
                    "ambiente"?: number | null,"autor_id"?: string,"borrada_en"?: string | null,"calidad_precio"?: number | null,"comida"?: number | null,"creado_en"?: string,"editado_en"?: string | null,"general"?: number,"grupo_id"?: string,"id"?: string,"lugar_id"?: string,"nota"?: string | null,"plan"?: string | null,"privada"?: boolean,"servicio"?: number | null,"visitado_en"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "resenas_autor_id_fkey"
      columns: ["autor_id"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resenas_grupo_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resenas_lugar_id_fkey"
      columns: ["lugar_id"]
isOneToOne: false
      referencedRelation: "lugares"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resenas_lugar_id_fkey"
      columns: ["lugar_id"]
isOneToOne: false
      referencedRelation: "lugares_resumen"
      referencedColumns: ["id"]
    }
                  ]
                },"tags": {
                  Row: {
                    "ambito": string,"id": string,"nombre": string,"orden": number
                  }
                  ComputedFields: never
                  Insert: {
                    "ambito"?: string,"id": string,"nombre": string,"orden"?: number
                  }
                  Update: {
                    "ambito"?: string,"id"?: string,"nombre"?: string,"orden"?: number
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "lugares_resumen": {
                  Row: {
                    "categoria_id": string | null,"creado_en": string | null,"creado_por": string | null,"direccion": string | null,"grupo_id": string | null,"id": string | null,"lat": number | null,"lng": number | null,"nombre": string | null,"precio": number | null,"promedio": number | null,"proveedor": string | null,"ref_externa": string | null,"total_resenas": number | null,"ultima_resena": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "lugares_categoria_id_fkey"
      columns: ["categoria_id"]
isOneToOne: false
      referencedRelation: "categorias"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lugares_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "perfiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lugares_grupo_id_fkey"
      columns: ["grupo_id"]
isOneToOne: false
      referencedRelation: "grupos"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "borrar_lugar":
{ Args: { "p_lugar": string }; Returns: (string)[]
                           },
"borrar_resena":
{ Args: { "p_resena": string }; Returns: (string)[]
                           },
"lugar_en_mi_grupo":
{ Args: { "p_lugar": string }; Returns: boolean
                           },
"lugar_por_referencia":
{ Args: { "p_proveedor": string,"p_ref": string }; Returns: string
                           },
"lugar_publico":
{ Args: { "p_lugar": string }; Returns: boolean
                           },
"mi_grupo":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"puedo_borrar_lugar":
{ Args: { "p_lugar": string }; Returns: boolean
                           },
"reclamar_invitacion":
{ Args: { "p_codigo"?: string }; Returns: {
              "avatar_url": string | null,
"creado_en": string,
"grupo_id": string,
"id": string,
"nombre": string
            }
                          SetofOptions: {
        from: "*"
        to: "perfiles"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
