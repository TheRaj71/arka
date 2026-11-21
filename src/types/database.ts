export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assets: {
        Row: {
          created_at: string
          customer_id: string
          deleted_at: string | null
          delivered_at: string
          id: string
          installed_at: string | null
          notes: string | null
          order_id: string
          product_id: string
          project_id: string
          replacement_of_asset_id: string | null
          serial_no: string
          status: Database["public"]["Enums"]["stock_unit_status"]
          stock_unit_id: string
          updated_at: string
          warranty_end: string | null
          warranty_months: number
          warranty_start: string | null
          warranty_void: boolean
        }
        Insert: {
          created_at?: string
          customer_id: string
          deleted_at?: string | null
          delivered_at: string
          id?: string
          installed_at?: string | null
          notes?: string | null
          order_id: string
          product_id: string
          project_id: string
          replacement_of_asset_id?: string | null
          serial_no: string
          status?: Database["public"]["Enums"]["stock_unit_status"]
          stock_unit_id: string
          updated_at?: string
          warranty_end?: string | null
          warranty_months: number
          warranty_start?: string | null
          warranty_void?: boolean
        }
        Update: {
          created_at?: string
          customer_id?: string
          deleted_at?: string | null
          delivered_at?: string
          id?: string
          installed_at?: string | null
          notes?: string | null
          order_id?: string
          product_id?: string
          project_id?: string
          replacement_of_asset_id?: string | null
          serial_no?: string
          status?: Database["public"]["Enums"]["stock_unit_status"]
          stock_unit_id?: string
          updated_at?: string
          warranty_end?: string | null
          warranty_months?: number
          warranty_start?: string | null
          warranty_void?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "assets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_replacement_of_asset_id_fkey"
            columns: ["replacement_of_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_stock_unit_id_fkey"
            columns: ["stock_unit_id"]
            isOneToOne: true
            referencedRelation: "stock_units"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_stock: {
        Row: {
          available: number | null
          on_hand: number
          product_id: string
          reserved: number
          updated_at: string
        }
        Insert: {
          available?: number | null
          on_hand?: number
          product_id: string
          reserved?: number
          updated_at?: string
        }
        Update: {
          available?: number | null
          on_hand?: number
          product_id?: string
          reserved?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          alt_phone_e164: string | null
          billing_address: string | null
          billing_city: string | null
          billing_pincode: string | null
          billing_state: string | null
          business_name: string | null
          created_at: string
          created_by: string | null
          customer_type: Database["public"]["Enums"]["customer_type"]
          deleted_at: string | null
          email: string | null
          gstin: string | null
          id: string
          name: string
          notes: string | null
          phone_e164: string
          row_version: number
          updated_at: string
        }
        Insert: {
          alt_phone_e164?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          business_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"]
          deleted_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name: string
          notes?: string | null
          phone_e164: string
          row_version?: number
          updated_at?: string
        }
        Update: {
          alt_phone_e164?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_pincode?: string | null
          billing_state?: string | null
          business_name?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"]
          deleted_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone_e164?: string
          row_version?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_items: {
        Row: {
          delivered_at: string | null
          dispatch_id: string
          id: string
          order_line_id: string
          product_id: string
          removed: boolean
          scanned_at: string
          scanned_by: string | null
          serial_no: string
          stock_unit_id: string
        }
        Insert: {
          delivered_at?: string | null
          dispatch_id: string
          id?: string
          order_line_id: string
          product_id: string
          removed?: boolean
          scanned_at?: string
          scanned_by?: string | null
          serial_no: string
          stock_unit_id: string
        }
        Update: {
          delivered_at?: string | null
          dispatch_id?: string
          id?: string
          order_line_id?: string
          product_id?: string
          removed?: boolean
          scanned_at?: string
          scanned_by?: string | null
          serial_no?: string
          stock_unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_items_dispatch_id_fkey"
            columns: ["dispatch_id"]
            isOneToOne: false
            referencedRelation: "dispatches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_items_order_line_id_fkey"
            columns: ["order_line_id"]
            isOneToOne: false
            referencedRelation: "order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_items_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_items_stock_unit_id_fkey"
            columns: ["stock_unit_id"]
            isOneToOne: true
            referencedRelation: "stock_units"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatches: {
        Row: {
          created_at: string
          delivered_at: string | null
          departed_at: string | null
          dispatch_no: string
          driver_name: string | null
          driver_phone: string | null
          id: string
          notes: string | null
          order_id: string
          pick_list_id: string
          scheduled_at: string | null
          status: Database["public"]["Enums"]["dispatch_status"]
          updated_at: string
          vehicle: string | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          departed_at?: string | null
          dispatch_no: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          notes?: string | null
          order_id: string
          pick_list_id: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["dispatch_status"]
          updated_at?: string
          vehicle?: string | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          departed_at?: string | null
          dispatch_no?: string
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          pick_list_id?: string
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["dispatch_status"]
          updated_at?: string
          vehicle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatches_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatches_pick_list_id_fkey"
            columns: ["pick_list_id"]
            isOneToOne: false
            referencedRelation: "pick_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_sequences: {
        Row: {
          fy: string
          last_no: number
          prefix: string
        }
        Insert: {
          fy: string
          last_no?: number
          prefix: string
        }
        Update: {
          fy?: string
          last_no?: number
          prefix?: string
        }
        Relationships: []
      }
      fault_codes: {
        Row: {
          brand: string
          code: string
          id: string
          is_active: boolean
          likely_cause: string | null
          severity: string
          suggested_action: string | null
          suggested_product_ids: string[]
          title: string
        }
        Insert: {
          brand?: string
          code: string
          id?: string
          is_active?: boolean
          likely_cause?: string | null
          severity?: string
          suggested_action?: string | null
          suggested_product_ids?: string[]
          title: string
        }
        Update: {
          brand?: string
          code?: string
          id?: string
          is_active?: boolean
          likely_cause?: string | null
          severity?: string
          suggested_action?: string | null
          suggested_product_ids?: string[]
          title?: string
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string
          key: string
          result: Json
        }
        Insert: {
          created_at?: string
          expires_at?: string
          key: string
          result: Json
        }
        Update: {
          created_at?: string
          expires_at?: string
          key?: string
          result?: Json
        }
        Relationships: []
      }
      install_reports: {
        Row: {
          client_submission_id: string | null
          created_at: string
          extra_materials: string | null
          id: string
          job_id: string
          panel_count_installed: number
          power_test_notes: string | null
          power_test_passed: boolean
          project_id: string
          refused_reason: string | null
          signature_path: string | null
          signature_status: Database["public"]["Enums"]["signature_status"]
          signed_at: string | null
          signed_by_name: string | null
          system_kw_confirmed: number
          updated_at: string
        }
        Insert: {
          client_submission_id?: string | null
          created_at?: string
          extra_materials?: string | null
          id?: string
          job_id: string
          panel_count_installed: number
          power_test_notes?: string | null
          power_test_passed: boolean
          project_id: string
          refused_reason?: string | null
          signature_path?: string | null
          signature_status?: Database["public"]["Enums"]["signature_status"]
          signed_at?: string | null
          signed_by_name?: string | null
          system_kw_confirmed: number
          updated_at?: string
        }
        Update: {
          client_submission_id?: string | null
          created_at?: string
          extra_materials?: string | null
          id?: string
          job_id?: string
          panel_count_installed?: number
          power_test_notes?: string | null
          power_test_passed?: boolean
          project_id?: string
          refused_reason?: string | null
          signature_path?: string | null
          signature_status?: Database["public"]["Enums"]["signature_status"]
          signed_at?: string | null
          signed_by_name?: string | null
          system_kw_confirmed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "install_reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "install_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          description: string
          gst_rate_bp: number
          hsn_code: string | null
          id: string
          invoice_id: string
          line_gst_paise: number
          line_no: number
          line_taxable_paise: number
          line_total_paise: number
          product_id: string | null
          qty: number
          sku: string | null
          unit_price_paise: number
          uom: string
        }
        Insert: {
          description: string
          gst_rate_bp: number
          hsn_code?: string | null
          id?: string
          invoice_id: string
          line_gst_paise: number
          line_no: number
          line_taxable_paise: number
          line_total_paise: number
          product_id?: string | null
          qty: number
          sku?: string | null
          unit_price_paise: number
          uom: string
        }
        Update: {
          description?: string
          gst_rate_bp?: number
          hsn_code?: string | null
          id?: string
          invoice_id?: string
          line_gst_paise?: number
          line_no?: number
          line_taxable_paise?: number
          line_total_paise?: number
          product_id?: string | null
          qty?: number
          sku?: string | null
          unit_price_paise?: number
          uom?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance_paise: number | null
          created_at: string
          customer_address: string | null
          customer_gstin: string | null
          customer_id: string
          customer_name: string
          discount_paise: number
          due_date: string | null
          gst_paise: number
          id: string
          invoice_date: string
          invoice_no: string
          issued_at: string | null
          issued_by: string | null
          kind: Database["public"]["Enums"]["invoice_kind"]
          notes: string | null
          order_id: string | null
          paid_paise: number
          pdf_path: string | null
          project_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal_paise: number
          taxable_paise: number
          terms: string | null
          ticket_id: string | null
          total_paise: number
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          balance_paise?: number | null
          created_at?: string
          customer_address?: string | null
          customer_gstin?: string | null
          customer_id: string
          customer_name: string
          discount_paise?: number
          due_date?: string | null
          gst_paise: number
          id?: string
          invoice_date: string
          invoice_no: string
          issued_at?: string | null
          issued_by?: string | null
          kind: Database["public"]["Enums"]["invoice_kind"]
          notes?: string | null
          order_id?: string | null
          paid_paise?: number
          pdf_path?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_paise: number
          taxable_paise: number
          terms?: string | null
          ticket_id?: string | null
          total_paise: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          balance_paise?: number | null
          created_at?: string
          customer_address?: string | null
          customer_gstin?: string | null
          customer_id?: string
          customer_name?: string
          discount_paise?: number
          due_date?: string | null
          gst_paise?: number
          id?: string
          invoice_date?: string
          invoice_no?: string
          issued_at?: string | null
          issued_by?: string | null
          kind?: Database["public"]["Enums"]["invoice_kind"]
          notes?: string | null
          order_id?: string | null
          paid_paise?: number
          pdf_path?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_paise?: number
          taxable_paise?: number
          terms?: string | null
          ticket_id?: string | null
          total_paise?: number
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_crew: {
        Row: {
          created_at: string
          crew_role: string
          id: string
          job_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          crew_role?: string
          id?: string
          job_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          crew_role?: string
          id?: string
          job_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_crew_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_crew_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_materials: {
        Row: {
          created_at: string
          id: string
          job_id: string
          product_id: string
          qty: number
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          product_id: string
          qty: number
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          product_id?: string
          qty?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_materials_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      job_photos: {
        Row: {
          created_at: string
          id: string
          job_id: string
          kind: Database["public"]["Enums"]["photo_kind"]
          lat: number | null
          lng: number | null
          path: string
          taken_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          kind: Database["public"]["Enums"]["photo_kind"]
          lat?: number | null
          lng?: number | null
          path: string
          taken_at: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          kind?: Database["public"]["Enums"]["photo_kind"]
          lat?: number | null
          lng?: number | null
          path?: string
          taken_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_photos_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          cancel_reason: string | null
          created_at: string
          created_by: string | null
          estimated_hours: number | null
          hold_reason: string | null
          id: string
          job_no: string
          notes: string | null
          project_id: string
          row_version: number
          scheduled_end: string | null
          scheduled_start: string | null
          site_address: string | null
          status: Database["public"]["Enums"]["job_status"]
          ticket_id: string | null
          title: string
          type: Database["public"]["Enums"]["job_type"]
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          cancel_reason?: string | null
          created_at?: string
          created_by?: string | null
          estimated_hours?: number | null
          hold_reason?: string | null
          id?: string
          job_no: string
          notes?: string | null
          project_id: string
          row_version?: number
          scheduled_end?: string | null
          scheduled_start?: string | null
          site_address?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          ticket_id?: string | null
          title: string
          type: Database["public"]["Enums"]["job_type"]
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          cancel_reason?: string | null
          created_at?: string
          created_by?: string | null
          estimated_hours?: number | null
          hold_reason?: string | null
          id?: string
          job_no?: string
          notes?: string | null
          project_id?: string
          row_version?: number
          scheduled_end?: string | null
          scheduled_start?: string | null
          site_address?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          ticket_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["job_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_jobs_ticket"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          kind: string
          lead_id: string
          meta: Json | null
          note: string | null
          outcome: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind: string
          lead_id: string
          meta?: Json | null
          note?: string | null
          outcome?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          lead_id?: string
          meta?: Json | null
          note?: string | null
          outcome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_qualifications: {
        Row: {
          consumer_name_on_bill: string | null
          consumer_number: string | null
          created_at: string
          discom: string | null
          grid_connection_suitable: boolean | null
          grid_notes: string | null
          id: string
          lead_id: string
          monthly_bill_paise: number | null
          monthly_units: number | null
          outcome: string
          reason: string | null
          recorded_by: string
          roof_ownership: string | null
          sanctioned_load_kw: number | null
          shadow_free_area_sqft: number | null
          suggested_kw: number | null
        }
        Insert: {
          consumer_name_on_bill?: string | null
          consumer_number?: string | null
          created_at?: string
          discom?: string | null
          grid_connection_suitable?: boolean | null
          grid_notes?: string | null
          id?: string
          lead_id: string
          monthly_bill_paise?: number | null
          monthly_units?: number | null
          outcome: string
          reason?: string | null
          recorded_by: string
          roof_ownership?: string | null
          sanctioned_load_kw?: number | null
          shadow_free_area_sqft?: number | null
          suggested_kw?: number | null
        }
        Update: {
          consumer_name_on_bill?: string | null
          consumer_number?: string | null
          created_at?: string
          discom?: string | null
          grid_connection_suitable?: boolean | null
          grid_notes?: string | null
          id?: string
          lead_id?: string
          monthly_bill_paise?: number | null
          monthly_units?: number | null
          outcome?: string
          reason?: string | null
          recorded_by?: string
          roof_ownership?: string | null
          sanctioned_load_kw?: number | null
          shadow_free_area_sqft?: number | null
          suggested_kw?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_qualifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_qualifications_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          attempt_count: number
          close_reason: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          last_contacted_at: string | null
          lead_no: string
          next_followup_at: string | null
          notes: string | null
          owner_id: string | null
          project_id: string | null
          requested_kw: number | null
          requirement: Database["public"]["Enums"]["system_type"] | null
          row_version: number
          site_address: string | null
          site_city: string | null
          site_pincode: string | null
          site_state: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          submit_ip_hash: string | null
          submit_user_agent: string | null
          updated_at: string
          utm: Json | null
          wants_subsidy: boolean
        }
        Insert: {
          attempt_count?: number
          close_reason?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          last_contacted_at?: string | null
          lead_no: string
          next_followup_at?: string | null
          notes?: string | null
          owner_id?: string | null
          project_id?: string | null
          requested_kw?: number | null
          requirement?: Database["public"]["Enums"]["system_type"] | null
          row_version?: number
          site_address?: string | null
          site_city?: string | null
          site_pincode?: string | null
          site_state?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          submit_ip_hash?: string | null
          submit_user_agent?: string | null
          updated_at?: string
          utm?: Json | null
          wants_subsidy?: boolean
        }
        Update: {
          attempt_count?: number
          close_reason?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          last_contacted_at?: string | null
          lead_no?: string
          next_followup_at?: string | null
          notes?: string | null
          owner_id?: string | null
          project_id?: string | null
          requested_kw?: number | null
          requirement?: Database["public"]["Enums"]["system_type"] | null
          row_version?: number
          site_address?: string | null
          site_city?: string | null
          site_pincode?: string | null
          site_state?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          submit_ip_hash?: string | null
          submit_user_agent?: string | null
          updated_at?: string
          utm?: Json | null
          wants_subsidy?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fk_leads_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          read_at: string | null
          recipient_id: string
          severity: string
          title: string
          type: string
          url: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
          severity?: string
          title: string
          type: string
          url?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          severity?: string
          title?: string
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_lines: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          description: string
          gst_rate_bp: number
          hsn_code: string | null
          id: string
          is_serialised: boolean
          line_gst_paise: number
          line_no: number
          line_taxable_paise: number
          line_total_paise: number
          order_id: string
          product_id: string
          qty: number
          qty_delivered: number
          qty_dispatched: number
          qty_reserved: number
          quote_line_id: string | null
          sku: string
          unit_price_paise: number
          uom: string
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          description: string
          gst_rate_bp: number
          hsn_code?: string | null
          id?: string
          is_serialised: boolean
          line_gst_paise: number
          line_no: number
          line_taxable_paise: number
          line_total_paise: number
          order_id: string
          product_id: string
          qty: number
          qty_delivered?: number
          qty_dispatched?: number
          qty_reserved?: number
          quote_line_id?: string | null
          sku: string
          unit_price_paise: number
          uom: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          description?: string
          gst_rate_bp?: number
          hsn_code?: string | null
          id?: string
          is_serialised?: boolean
          line_gst_paise?: number
          line_no?: number
          line_taxable_paise?: number
          line_total_paise?: number
          order_id?: string
          product_id?: string
          qty?: number
          qty_delivered?: number
          qty_dispatched?: number
          qty_reserved?: number
          quote_line_id?: string | null
          sku?: string
          unit_price_paise?: number
          uom?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_quote_line_id_fkey"
            columns: ["quote_line_id"]
            isOneToOne: false
            referencedRelation: "quote_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          advance_required_paise: number
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          delivered_at: string | null
          delivery_address: string | null
          delivery_name: string | null
          delivery_phone: string | null
          force_confirmed: boolean
          force_reason: string | null
          gst_paise: number
          id: string
          order_no: string
          paid_paise: number
          pay_status: Database["public"]["Enums"]["order_pay_status"]
          project_id: string
          quote_id: string
          refund_due_paise: number
          row_version: number
          status: Database["public"]["Enums"]["order_status"]
          taxable_paise: number
          total_paise: number
          updated_at: string
        }
        Insert: {
          advance_required_paise: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          force_confirmed?: boolean
          force_reason?: string | null
          gst_paise: number
          id?: string
          order_no: string
          paid_paise?: number
          pay_status?: Database["public"]["Enums"]["order_pay_status"]
          project_id: string
          quote_id: string
          refund_due_paise?: number
          row_version?: number
          status?: Database["public"]["Enums"]["order_status"]
          taxable_paise: number
          total_paise: number
          updated_at?: string
        }
        Update: {
          advance_required_paise?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          force_confirmed?: boolean
          force_reason?: string | null
          gst_paise?: number
          id?: string
          order_no?: string
          paid_paise?: number
          pay_status?: Database["public"]["Enums"]["order_pay_status"]
          project_id?: string
          quote_id?: string
          refund_due_paise?: number
          row_version?: number
          status?: Database["public"]["Enums"]["order_status"]
          taxable_paise?: number
          total_paise?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: true
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      package_template_items: {
        Row: {
          id: string
          is_required: boolean
          min_qty: number
          notes: string | null
          product_id: string
          qty_rule: Database["public"]["Enums"]["qty_rule"]
          qty_value: number
          rounding: Database["public"]["Enums"]["qty_rounding"]
          sort: number
          template_id: string
          when_roof_types: Database["public"]["Enums"]["roof_type"][] | null
        }
        Insert: {
          id?: string
          is_required?: boolean
          min_qty?: number
          notes?: string | null
          product_id: string
          qty_rule?: Database["public"]["Enums"]["qty_rule"]
          qty_value?: number
          rounding?: Database["public"]["Enums"]["qty_rounding"]
          sort?: number
          template_id: string
          when_roof_types?: Database["public"]["Enums"]["roof_type"][] | null
        }
        Update: {
          id?: string
          is_required?: boolean
          min_qty?: number
          notes?: string | null
          product_id?: string
          qty_rule?: Database["public"]["Enums"]["qty_rule"]
          qty_value?: number
          rounding?: Database["public"]["Enums"]["qty_rounding"]
          sort?: number
          template_id?: string
          when_roof_types?: Database["public"]["Enums"]["roof_type"][] | null
        }
        Relationships: [
          {
            foreignKeyName: "package_template_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "package_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      package_templates: {
        Row: {
          capacity_kw: number
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          row_version: number
          system_type: Database["public"]["Enums"]["system_type"]
          updated_at: string
        }
        Insert: {
          capacity_kw: number
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          row_version?: number
          system_type: Database["public"]["Enums"]["system_type"]
          updated_at?: string
        }
        Update: {
          capacity_kw?: number
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          row_version?: number
          system_type?: Database["public"]["Enums"]["system_type"]
          updated_at?: string
        }
        Relationships: []
      }
      pay_entries: {
        Row: {
          created_at: string
          deductions_paise: number
          gross_paise: number
          hours_worked: number
          id: string
          jobs_completed: number
          net_paise: number | null
          pay_period_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          deductions_paise?: number
          gross_paise?: number
          hours_worked?: number
          id?: string
          jobs_completed?: number
          net_paise?: number | null
          pay_period_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          deductions_paise?: number
          gross_paise?: number
          hours_worked?: number
          id?: string
          jobs_completed?: number
          net_paise?: number | null
          pay_period_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pay_entries_pay_period_id_fkey"
            columns: ["pay_period_id"]
            isOneToOne: false
            referencedRelation: "pay_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_periods: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          locked_at: string | null
          locked_by: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["pay_period_status"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["pay_period_status"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["pay_period_status"]
        }
        Relationships: [
          {
            foreignKeyName: "pay_periods_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_periods_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          allocated_paise: number
          created_at: string
          id: string
          invoice_id: string | null
          payment_id: string
        }
        Insert: {
          allocated_paise: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          payment_id: string
        }
        Update: {
          allocated_paise?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment_allocations_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paise: number
          created_at: string
          customer_id: string
          id: string
          idempotency_key: string | null
          invoice_id: string | null
          kind: Database["public"]["Enums"]["payment_kind"]
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          order_id: string | null
          payment_no: string
          project_id: string | null
          received_at: string | null
          recorded_by: string
          reference: string | null
          reverse_reason: string | null
          reversed_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          ticket_id: string | null
          updated_at: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          customer_id: string
          id?: string
          idempotency_key?: string | null
          invoice_id?: string | null
          kind: Database["public"]["Enums"]["payment_kind"]
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          order_id?: string | null
          payment_no: string
          project_id?: string | null
          received_at?: string | null
          recorded_by: string
          reference?: string | null
          reverse_reason?: string | null
          reversed_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          ticket_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          customer_id?: string
          id?: string
          idempotency_key?: string | null
          invoice_id?: string | null
          kind?: Database["public"]["Enums"]["payment_kind"]
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          order_id?: string | null
          payment_no?: string
          project_id?: string | null
          received_at?: string | null
          recorded_by?: string
          reference?: string | null
          reverse_reason?: string | null
          reversed_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          ticket_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_payments_ticket"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pick_list_lines: {
        Row: {
          description: string
          id: string
          is_serialised: boolean
          line_no: number
          pick_list_id: string
          product_id: string
          qty: number
          qty_picked: number
          sku: string
        }
        Insert: {
          description: string
          id?: string
          is_serialised: boolean
          line_no: number
          pick_list_id: string
          product_id: string
          qty: number
          qty_picked?: number
          sku: string
        }
        Update: {
          description?: string
          id?: string
          is_serialised?: boolean
          line_no?: number
          pick_list_id?: string
          product_id?: string
          qty?: number
          qty_picked?: number
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "pick_list_lines_pick_list_id_fkey"
            columns: ["pick_list_id"]
            isOneToOne: false
            referencedRelation: "pick_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pick_list_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pick_lists: {
        Row: {
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          dispatch_blocked: boolean
          id: string
          notes: string | null
          order_id: string
          project_no: string
          status: Database["public"]["Enums"]["pick_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          dispatch_blocked?: boolean
          id?: string
          notes?: string | null
          order_id: string
          project_no: string
          status?: Database["public"]["Enums"]["pick_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          dispatch_blocked?: boolean
          id?: string
          notes?: string | null
          order_id?: string
          project_no?: string
          status?: Database["public"]["Enums"]["pick_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pick_lists_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_costs: {
        Row: {
          avg_cost_paise: number
          product_id: string
          standard_cost_paise: number
          updated_at: string
        }
        Insert: {
          avg_cost_paise?: number
          product_id: string
          standard_cost_paise?: number
          updated_at?: string
        }
        Update: {
          avg_cost_paise?: number
          product_id?: string
          standard_cost_paise?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_costs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          capacity_kw: number | null
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          gst_rate_bp: number
          hsn_code: string | null
          id: string
          is_active: boolean
          is_dcr: boolean
          is_serialised: boolean
          model: string | null
          name: string
          price_paise: number
          reorder_level: number
          row_version: number
          sku: string
          spec: Json
          tracks_stock: boolean
          uom: string
          updated_at: string
          warranty_months: number | null
          wattage_w: number | null
        }
        Insert: {
          brand?: string | null
          capacity_kw?: number | null
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          gst_rate_bp?: number
          hsn_code?: string | null
          id?: string
          is_active?: boolean
          is_dcr?: boolean
          is_serialised?: boolean
          model?: string | null
          name: string
          price_paise?: number
          reorder_level?: number
          row_version?: number
          sku: string
          spec?: Json
          tracks_stock?: boolean
          uom?: string
          updated_at?: string
          warranty_months?: number | null
          wattage_w?: number | null
        }
        Update: {
          brand?: string | null
          capacity_kw?: number | null
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          gst_rate_bp?: number
          hsn_code?: string | null
          id?: string
          is_active?: boolean
          is_dcr?: boolean
          is_serialised?: boolean
          model?: string | null
          name?: string
          price_paise?: number
          reorder_level?: number
          row_version?: number
          sku?: string
          spec?: Json
          tracks_stock?: boolean
          uom?: string
          updated_at?: string
          warranty_months?: number | null
          wattage_w?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clerk_user_id: string
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          row_version: number
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          row_version?: number
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          row_version?: number
          updated_at?: string
        }
        Relationships: []
      }
      project_costs: {
        Row: {
          amount_paise: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          kind: string
          project_id: string
          source_id: string
          source_type: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind: string
          project_id: string
          source_id: string
          source_type: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind?: string
          project_id?: string
          source_id?: string
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_costs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          cancel_reason: string | null
          commissioned_on: string | null
          completed_on: string | null
          consumer_name_on_bill: string | null
          consumer_number: string | null
          created_at: string
          current_quote_id: string | null
          customer_id: string
          customer_type: Database["public"]["Enums"]["customer_type"]
          discom: string | null
          final_kw: number | null
          hold_reason: string | null
          id: string
          installed_on: string | null
          lead_id: string | null
          order_id: string | null
          project_no: string
          requested_kw: number
          row_version: number
          sales_owner_id: string | null
          sanctioned_load_kw: number | null
          site_address: string
          site_city: string | null
          site_lat: number | null
          site_lng: number | null
          site_pincode: string | null
          site_state: string | null
          stage: Database["public"]["Enums"]["project_stage"]
          subsidy_eligible: boolean
          subsidy_override_reason: string | null
          system_type: Database["public"]["Enums"]["system_type"]
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          commissioned_on?: string | null
          completed_on?: string | null
          consumer_name_on_bill?: string | null
          consumer_number?: string | null
          created_at?: string
          current_quote_id?: string | null
          customer_id: string
          customer_type: Database["public"]["Enums"]["customer_type"]
          discom?: string | null
          final_kw?: number | null
          hold_reason?: string | null
          id?: string
          installed_on?: string | null
          lead_id?: string | null
          order_id?: string | null
          project_no: string
          requested_kw: number
          row_version?: number
          sales_owner_id?: string | null
          sanctioned_load_kw?: number | null
          site_address: string
          site_city?: string | null
          site_lat?: number | null
          site_lng?: number | null
          site_pincode?: string | null
          site_state?: string | null
          stage?: Database["public"]["Enums"]["project_stage"]
          subsidy_eligible?: boolean
          subsidy_override_reason?: string | null
          system_type: Database["public"]["Enums"]["system_type"]
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          commissioned_on?: string | null
          completed_on?: string | null
          consumer_name_on_bill?: string | null
          consumer_number?: string | null
          created_at?: string
          current_quote_id?: string | null
          customer_id?: string
          customer_type?: Database["public"]["Enums"]["customer_type"]
          discom?: string | null
          final_kw?: number | null
          hold_reason?: string | null
          id?: string
          installed_on?: string | null
          lead_id?: string | null
          order_id?: string | null
          project_no?: string
          requested_kw?: number
          row_version?: number
          sales_owner_id?: string | null
          sanctioned_load_kw?: number | null
          site_address?: string
          site_city?: string | null
          site_lat?: number | null
          site_lng?: number | null
          site_pincode?: string | null
          site_state?: string | null
          stage?: Database["public"]["Enums"]["project_stage"]
          subsidy_eligible?: boolean
          subsidy_override_reason?: string | null
          system_type?: Database["public"]["Enums"]["system_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_current_quote"
            columns: ["current_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_projects_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_sales_owner_id_fkey"
            columns: ["sales_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_line_costs: {
        Row: {
          purchase_line_id: string
          unit_cost_paise: number
        }
        Insert: {
          purchase_line_id: string
          unit_cost_paise: number
        }
        Update: {
          purchase_line_id?: string
          unit_cost_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_line_costs_purchase_line_id_fkey"
            columns: ["purchase_line_id"]
            isOneToOne: true
            referencedRelation: "purchase_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_lines: {
        Row: {
          description: string
          id: string
          line_no: number
          line_total_paise: number
          product_id: string
          purchase_id: string
          qty: number
          sku: string
          unit_cost_paise: number
        }
        Insert: {
          description: string
          id?: string
          line_no: number
          line_total_paise: number
          product_id: string
          purchase_id: string
          qty: number
          sku: string
          unit_cost_paise: number
        }
        Update: {
          description?: string
          id?: string
          line_no?: number
          line_total_paise?: number
          product_id?: string
          purchase_id?: string
          qty?: number
          sku?: string
          unit_cost_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_lines_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invoice_date: string | null
          invoice_no: string | null
          notes: string | null
          purchase_date: string
          purchase_no: string
          received_at: string | null
          received_by: string | null
          supplier_id: string
          total_paise: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invoice_date?: string | null
          invoice_no?: string | null
          notes?: string | null
          purchase_date: string
          purchase_no: string
          received_at?: string | null
          received_by?: string | null
          supplier_id: string
          total_paise: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invoice_date?: string | null
          invoice_no?: string | null
          notes?: string | null
          purchase_date?: string
          purchase_no?: string
          received_at?: string | null
          received_by?: string | null
          supplier_id?: string
          total_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_line_costs: {
        Row: {
          quote_line_id: string
          unit_cost_paise: number
        }
        Insert: {
          quote_line_id: string
          unit_cost_paise: number
        }
        Update: {
          quote_line_id?: string
          unit_cost_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_costs_quote_line_id_fkey"
            columns: ["quote_line_id"]
            isOneToOne: true
            referencedRelation: "quote_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_lines: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          description: string
          gst_rate_bp: number
          hsn_code: string | null
          id: string
          is_serialised: boolean
          line_discount_paise: number
          line_gst_paise: number
          line_no: number
          line_subtotal_paise: number
          line_taxable_paise: number
          line_total_paise: number
          product_id: string
          qty: number
          qty_rule: Database["public"]["Enums"]["qty_rule"] | null
          quote_id: string
          sku: string
          source: string
          unit_price_paise: number
          uom: string
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          description: string
          gst_rate_bp: number
          hsn_code?: string | null
          id?: string
          is_serialised: boolean
          line_discount_paise?: number
          line_gst_paise: number
          line_no: number
          line_subtotal_paise: number
          line_taxable_paise: number
          line_total_paise: number
          product_id: string
          qty: number
          qty_rule?: Database["public"]["Enums"]["qty_rule"] | null
          quote_id: string
          sku: string
          source: string
          unit_price_paise: number
          uom: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          description?: string
          gst_rate_bp?: number
          hsn_code?: string | null
          id?: string
          is_serialised?: boolean
          line_discount_paise?: number
          line_gst_paise?: number
          line_no?: number
          line_subtotal_paise?: number
          line_taxable_paise?: number
          line_total_paise?: number
          product_id?: string
          qty?: number
          qty_rule?: Database["public"]["Enums"]["qty_rule"] | null
          quote_id?: string
          sku?: string
          source?: string
          unit_price_paise?: number
          uom?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_lines_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          accepted_ip_hash: string | null
          accepted_name: string | null
          approval_reason: string | null
          approval_required: boolean
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          customer_notes: string | null
          dc_capacity_wp: number | null
          discount_paise: number
          expired_at: string | null
          gst_paise: number
          id: string
          net_cost_paise: number
          nominal_kw: number
          panel_count: number | null
          parent_quote_id: string | null
          pdf_path: string | null
          project_id: string
          quote_no: string
          rejected_at: string | null
          rejected_reason: string | null
          row_version: number
          sent_at: string | null
          sent_by: string | null
          status: Database["public"]["Enums"]["quote_status"]
          subsidy_eligible: boolean
          subsidy_paise: number
          subtotal_paise: number
          survey_id: string
          system_type: Database["public"]["Enums"]["system_type"]
          taxable_paise: number
          template_id: string | null
          terms: string | null
          total_paise: number
          updated_at: string
          valid_until: string | null
          version: number
        }
        Insert: {
          accepted_at?: string | null
          accepted_ip_hash?: string | null
          accepted_name?: string | null
          approval_reason?: string | null
          approval_required?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          customer_notes?: string | null
          dc_capacity_wp?: number | null
          discount_paise?: number
          expired_at?: string | null
          gst_paise?: number
          id?: string
          net_cost_paise?: number
          nominal_kw: number
          panel_count?: number | null
          parent_quote_id?: string | null
          pdf_path?: string | null
          project_id: string
          quote_no: string
          rejected_at?: string | null
          rejected_reason?: string | null
          row_version?: number
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subsidy_eligible?: boolean
          subsidy_paise?: number
          subtotal_paise?: number
          survey_id: string
          system_type: Database["public"]["Enums"]["system_type"]
          taxable_paise?: number
          template_id?: string | null
          terms?: string | null
          total_paise?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Update: {
          accepted_at?: string | null
          accepted_ip_hash?: string | null
          accepted_name?: string | null
          approval_reason?: string | null
          approval_required?: boolean
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          customer_notes?: string | null
          dc_capacity_wp?: number | null
          discount_paise?: number
          expired_at?: string | null
          gst_paise?: number
          id?: string
          net_cost_paise?: number
          nominal_kw?: number
          panel_count?: number | null
          parent_quote_id?: string | null
          pdf_path?: string | null
          project_id?: string
          quote_no?: string
          rejected_at?: string | null
          rejected_reason?: string | null
          row_version?: number
          sent_at?: string | null
          sent_by?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subsidy_eligible?: boolean
          subsidy_paise?: number
          subtotal_paise?: number
          survey_id?: string
          system_type?: Database["public"]["Enums"]["system_type"]
          taxable_paise?: number
          template_id?: string | null
          terms?: string | null
          total_paise?: number
          updated_at?: string
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "package_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      scan_events: {
        Row: {
          actor_id: string | null
          created_at: string
          dispatch_id: string
          id: string
          idempotency_key: string
          message: string | null
          result: Database["public"]["Enums"]["scan_result"]
          serial_input: string
          stock_unit_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          dispatch_id: string
          id?: string
          idempotency_key: string
          message?: string | null
          result: Database["public"]["Enums"]["scan_result"]
          serial_input: string
          stock_unit_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          dispatch_id?: string
          id?: string
          idempotency_key?: string
          message?: string | null
          result?: Database["public"]["Enums"]["scan_result"]
          serial_input?: string
          stock_unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_events_dispatch_id_fkey"
            columns: ["dispatch_id"]
            isOneToOne: false
            referencedRelation: "dispatches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_events_stock_unit_id_fkey"
            columns: ["stock_unit_id"]
            isOneToOne: false
            referencedRelation: "stock_units"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          access_count: number
          created_at: string
          created_by: string
          entity_id: string
          expires_at: string | null
          id: string
          kind: Database["public"]["Enums"]["share_kind"]
          last_access_at: string | null
          last_ip_hash: string | null
          params: Json
          redact_pii: boolean
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          access_count?: number
          created_at?: string
          created_by: string
          entity_id: string
          expires_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["share_kind"]
          last_access_at?: string | null
          last_ip_hash?: string | null
          params?: Json
          redact_pii?: boolean
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          access_count?: number
          created_at?: string
          created_by?: string
          entity_id?: string
          expires_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["share_kind"]
          last_access_at?: string | null
          last_ip_hash?: string | null
          params?: Json
          redact_pii?: boolean
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      status_history: {
        Row: {
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          from_status: string | null
          id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_adjustments: {
        Row: {
          adjustment_type: Database["public"]["Enums"]["movement_type"]
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          product_id: string
          qty: number
          reason: string
          requested_by: string
          status: Database["public"]["Enums"]["adjustment_status"]
        }
        Insert: {
          adjustment_type: Database["public"]["Enums"]["movement_type"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          product_id: string
          qty: number
          reason: string
          requested_by: string
          status?: Database["public"]["Enums"]["adjustment_status"]
        }
        Update: {
          adjustment_type?: Database["public"]["Enums"]["movement_type"]
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          product_id?: string
          qty?: number
          reason?: string
          requested_by?: string
          status?: Database["public"]["Enums"]["adjustment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          order_id: string | null
          order_line_id: string | null
          product_id: string
          qty: number
          reason: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          order_id?: string | null
          order_line_id?: string | null
          product_id: string
          qty: number
          reason?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          order_id?: string | null
          order_line_id?: string | null
          product_id?: string
          qty?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_order_line_id_fkey"
            columns: ["order_line_id"]
            isOneToOne: false
            referencedRelation: "order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_unit_costs: {
        Row: {
          stock_unit_id: string
          unit_cost_paise: number
        }
        Insert: {
          stock_unit_id: string
          unit_cost_paise: number
        }
        Update: {
          stock_unit_id?: string
          unit_cost_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_unit_costs_stock_unit_id_fkey"
            columns: ["stock_unit_id"]
            isOneToOne: true
            referencedRelation: "stock_units"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_units: {
        Row: {
          asset_id: string | null
          created_at: string
          deleted_at: string | null
          dispatch_id: string | null
          id: string
          location: string | null
          notes: string | null
          product_id: string
          received_at: string
          reserved_at: string | null
          reserved_order_id: string | null
          reserved_order_line_id: string | null
          serial_no: string
          status: Database["public"]["Enums"]["stock_unit_status"]
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          deleted_at?: string | null
          dispatch_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          product_id: string
          received_at?: string
          reserved_at?: string | null
          reserved_order_id?: string | null
          reserved_order_line_id?: string | null
          serial_no: string
          status?: Database["public"]["Enums"]["stock_unit_status"]
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          deleted_at?: string | null
          dispatch_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          product_id?: string
          received_at?: string
          reserved_at?: string | null
          reserved_order_id?: string | null
          reserved_order_line_id?: string | null
          serial_no?: string
          status?: Database["public"]["Enums"]["stock_unit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_stock_units_asset"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stock_units_dispatch"
            columns: ["dispatch_id"]
            isOneToOne: false
            referencedRelation: "dispatches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_units_reserved_order_id_fkey"
            columns: ["reserved_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_units_reserved_order_line_id_fkey"
            columns: ["reserved_order_line_id"]
            isOneToOne: false
            referencedRelation: "order_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      subsidy_applications: {
        Row: {
          claim_submitted_date: string | null
          commissioned_date: string | null
          created_at: string
          credited_date: string | null
          credited_paise: number
          estimated_paise: number
          id: string
          inspection_date: string | null
          installation_date: string | null
          notes: string | null
          project_id: string
          registration_date: string | null
          rejected_reason: string | null
          status: Database["public"]["Enums"]["subsidy_status"]
          updated_at: string
        }
        Insert: {
          claim_submitted_date?: string | null
          commissioned_date?: string | null
          created_at?: string
          credited_date?: string | null
          credited_paise?: number
          estimated_paise?: number
          id?: string
          inspection_date?: string | null
          installation_date?: string | null
          notes?: string | null
          project_id: string
          registration_date?: string | null
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["subsidy_status"]
          updated_at?: string
        }
        Update: {
          claim_submitted_date?: string | null
          commissioned_date?: string | null
          created_at?: string
          credited_date?: string | null
          credited_paise?: number
          estimated_paise?: number
          id?: string
          inspection_date?: string | null
          installation_date?: string | null
          notes?: string | null
          project_id?: string
          registration_date?: string | null
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["subsidy_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subsidy_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subsidy_checklist_items: {
        Row: {
          completed_at: string | null
          id: string
          is_complete: boolean
          is_required: boolean
          item_key: string
          item_name: string
          notes: string | null
          subsidy_application_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          is_complete?: boolean
          is_required: boolean
          item_key: string
          item_name: string
          notes?: string | null
          subsidy_application_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          is_complete?: boolean
          is_required?: boolean
          item_key?: string
          item_name?: string
          notes?: string | null
          subsidy_application_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subsidy_checklist_items_subsidy_application_id_fkey"
            columns: ["subsidy_application_id"]
            isOneToOne: false
            referencedRelation: "subsidy_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          is_active: boolean
          name: string
          payment_terms: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name: string
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name?: string
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      surveys: {
        Row: {
          cable_ac_m: number | null
          cable_dc_m: number | null
          client_submission_id: string | null
          created_at: string
          earthing_distance_m: number | null
          feasibility: Database["public"]["Enums"]["feasibility"] | null
          grid_connection_ok: boolean | null
          id: string
          job_id: string
          meter_location: string | null
          notes: string | null
          project_id: string
          recommended_kw: number | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          revision: number
          roof_direction: Database["public"]["Enums"]["roof_direction"] | null
          roof_tilt_deg: number | null
          roof_type: Database["public"]["Enums"]["roof_type"] | null
          row_version: number
          shading_notes: string | null
          shadow_free_area_sqft: number | null
          status: Database["public"]["Enums"]["survey_status"]
          structure_height_m: number | null
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          cable_ac_m?: number | null
          cable_dc_m?: number | null
          client_submission_id?: string | null
          created_at?: string
          earthing_distance_m?: number | null
          feasibility?: Database["public"]["Enums"]["feasibility"] | null
          grid_connection_ok?: boolean | null
          id?: string
          job_id: string
          meter_location?: string | null
          notes?: string | null
          project_id: string
          recommended_kw?: number | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision?: number
          roof_direction?: Database["public"]["Enums"]["roof_direction"] | null
          roof_tilt_deg?: number | null
          roof_type?: Database["public"]["Enums"]["roof_type"] | null
          row_version?: number
          shading_notes?: string | null
          shadow_free_area_sqft?: number | null
          status?: Database["public"]["Enums"]["survey_status"]
          structure_height_m?: number | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          cable_ac_m?: number | null
          cable_dc_m?: number | null
          client_submission_id?: string | null
          created_at?: string
          earthing_distance_m?: number | null
          feasibility?: Database["public"]["Enums"]["feasibility"] | null
          grid_connection_ok?: boolean | null
          id?: string
          job_id?: string
          meter_location?: string | null
          notes?: string | null
          project_id?: string
          recommended_kw?: number | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision?: number
          roof_direction?: Database["public"]["Enums"]["roof_direction"] | null
          roof_tilt_deg?: number | null
          roof_type?: Database["public"]["Enums"]["roof_type"] | null
          row_version?: number
          shading_notes?: string | null
          shadow_free_area_sqft?: number | null
          status?: Database["public"]["Enums"]["survey_status"]
          structure_height_m?: number | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_rates: {
        Row: {
          created_at: string
          effective_from: string
          hourly_rate_paise: number | null
          pay_model: Database["public"]["Enums"]["pay_model"]
          per_job_rate_paise: number | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_from?: string
          hourly_rate_paise?: number | null
          pay_model?: Database["public"]["Enums"]["pay_model"]
          per_job_rate_paise?: number | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          hourly_rate_paise?: number | null
          pay_model?: Database["public"]["Enums"]["pay_model"]
          per_job_rate_paise?: number | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_rates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          meta: Json | null
          note: string | null
          ticket_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          meta?: Json | null
          note?: string | null
          ticket_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json | null
          note?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_labour: {
        Row: {
          billable: boolean
          created_at: string
          created_by: string | null
          description: string
          hours: number
          id: string
          rate_paise_per_hour: number
          ticket_id: string
        }
        Insert: {
          billable: boolean
          created_at?: string
          created_by?: string | null
          description: string
          hours: number
          id?: string
          rate_paise_per_hour: number
          ticket_id: string
        }
        Update: {
          billable?: boolean
          created_at?: string
          created_by?: string | null
          description?: string
          hours?: number
          id?: string
          rate_paise_per_hour?: number
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_labour_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_labour_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_parts: {
        Row: {
          billable: boolean
          created_at: string
          created_by: string | null
          id: string
          product_id: string
          qty: number
          ticket_id: string
          unit_price_paise: number
        }
        Insert: {
          billable: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          product_id: string
          qty: number
          ticket_id: string
          unit_price_paise: number
        }
        Update: {
          billable?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          product_id?: string
          qty?: number
          ticket_id?: string
          unit_price_paise?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_parts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_parts_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          asset_id: string | null
          assigned_to: string | null
          billing: Database["public"]["Enums"]["ticket_billing"]
          channel: Database["public"]["Enums"]["ticket_channel"]
          created_at: string
          created_by: string | null
          customer_confirmation_method: string | null
          customer_confirmed_at: string | null
          customer_id: string
          description: string
          fault_code: string | null
          id: string
          is_repeat: boolean
          issue_type: string | null
          priority: Database["public"]["Enums"]["ticket_priority"]
          project_id: string | null
          reopen_count: number
          repeat_of_ticket_id: string | null
          reported_by_name: string
          reported_by_phone: string
          sla_due_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_no: string
          updated_at: string
          warranty_basis: Json | null
          warranty_decision: Database["public"]["Enums"]["warranty_decision"]
        }
        Insert: {
          asset_id?: string | null
          assigned_to?: string | null
          billing?: Database["public"]["Enums"]["ticket_billing"]
          channel?: Database["public"]["Enums"]["ticket_channel"]
          created_at?: string
          created_by?: string | null
          customer_confirmation_method?: string | null
          customer_confirmed_at?: string | null
          customer_id: string
          description: string
          fault_code?: string | null
          id?: string
          is_repeat?: boolean
          issue_type?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string | null
          reopen_count?: number
          repeat_of_ticket_id?: string | null
          reported_by_name: string
          reported_by_phone: string
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_no: string
          updated_at?: string
          warranty_basis?: Json | null
          warranty_decision?: Database["public"]["Enums"]["warranty_decision"]
        }
        Update: {
          asset_id?: string | null
          assigned_to?: string | null
          billing?: Database["public"]["Enums"]["ticket_billing"]
          channel?: Database["public"]["Enums"]["ticket_channel"]
          created_at?: string
          created_by?: string | null
          customer_confirmation_method?: string | null
          customer_confirmed_at?: string | null
          customer_id?: string
          description?: string
          fault_code?: string | null
          id?: string
          is_repeat?: boolean
          issue_type?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string | null
          reopen_count?: number
          repeat_of_ticket_id?: string | null
          reported_by_name?: string
          reported_by_phone?: string
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_no?: string
          updated_at?: string
          warranty_basis?: Json | null
          warranty_decision?: Database["public"]["Enums"]["warranty_decision"]
        }
        Relationships: [
          {
            foreignKeyName: "tickets_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_repeat_of_ticket_id_fkey"
            columns: ["repeat_of_ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          break_minutes: number
          created_at: string
          ended_at: string | null
          id: string
          job_id: string
          notes: string | null
          profile_id: string
          started_at: string
          updated_at: string
        }
        Insert: {
          break_minutes?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          job_id: string
          notes?: string | null
          profile_id: string
          started_at: string
          updated_at?: string
        }
        Update: {
          break_minutes?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          profile_id?: string
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      variations: {
        Row: {
          adjustment_paise: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          installed_kw: number
          project_id: string
          quote_id: string
          quoted_kw: number
          reason: string
          requested_by: string
          status: Database["public"]["Enums"]["variation_status"]
        }
        Insert: {
          adjustment_paise: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          installed_kw: number
          project_id: string
          quote_id: string
          quoted_kw: number
          reason: string
          requested_by: string
          status?: Database["public"]["Enums"]["variation_status"]
        }
        Update: {
          adjustment_paise?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          installed_kw?: number
          project_id?: string
          quote_id?: string
          quoted_kw?: number
          reason?: string
          requested_by?: string
          status?: Database["public"]["Enums"]["variation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "variations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variations_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variations_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      adjustment_status: "pending" | "approved" | "rejected"
      app_role:
        | "director"
        | "manager"
        | "sales"
        | "technician"
        | "warehouse"
        | "support"
        | "accounts"
      customer_type: "residential" | "commercial" | "industrial"
      dispatch_status:
        | "draft"
        | "loading"
        | "in_transit"
        | "delivered"
        | "partially_delivered"
        | "returned"
        | "cancelled"
      feasibility: "feasible" | "feasible_with_changes" | "not_feasible"
      invoice_kind: "order" | "service" | "variation" | "credit_note"
      invoice_status: "draft" | "issued" | "partially_paid" | "paid" | "void"
      job_status:
        | "unscheduled"
        | "scheduled"
        | "in_progress"
        | "awaiting_signature"
        | "completed"
        | "on_hold"
        | "cancelled"
      job_type: "survey" | "install" | "service"
      lead_source:
        | "web"
        | "call"
        | "whatsapp"
        | "walk_in"
        | "referral"
        | "other"
      lead_status:
        | "new"
        | "contacting"
        | "follow_up"
        | "converted"
        | "unreachable"
        | "disqualified"
        | "lost"
      movement_type:
        | "received"
        | "reserved"
        | "unreserved"
        | "issued"
        | "returned"
        | "adjusted_up"
        | "adjusted_down"
      order_pay_status:
        | "unpaid"
        | "partial"
        | "advance_met"
        | "paid"
        | "overpaid"
      order_status:
        | "pending_payment"
        | "confirmed"
        | "in_fulfilment"
        | "delivered"
        | "completed"
        | "cancelled"
      pay_model: "hourly" | "per_job" | "salaried"
      pay_period_status: "open" | "locked" | "approved" | "paid"
      payment_kind: "advance" | "balance" | "full" | "service" | "refund"
      payment_method:
        | "upi"
        | "cash"
        | "bank_transfer"
        | "cheque"
        | "card"
        | "other"
      payment_status: "pending" | "received" | "failed" | "reversed" | "bounced"
      photo_kind:
        | "survey_roof"
        | "survey_meter"
        | "survey_db"
        | "survey_obstruction"
        | "before"
        | "panels"
        | "inverter"
        | "earthing"
        | "db_box"
        | "meter"
        | "serial_label"
        | "power_test"
        | "finished"
        | "other"
      pick_status: "pending" | "picking" | "packed" | "dispatched" | "cancelled"
      product_category:
        | "panel"
        | "inverter"
        | "battery"
        | "charge_controller"
        | "structure"
        | "cable"
        | "protection"
        | "earthing"
        | "connector"
        | "junction_box"
        | "accessory"
        | "service"
      project_stage:
        | "qualified"
        | "survey_scheduled"
        | "survey_submitted"
        | "survey_approved"
        | "quoted"
        | "awaiting_payment"
        | "order_confirmed"
        | "dispatched"
        | "delivered"
        | "installed"
        | "commissioned"
        | "completed"
        | "on_hold"
        | "cancelled"
      qty_rounding: "ceil" | "round" | "none"
      qty_rule:
        | "fixed"
        | "per_kw"
        | "panel_count"
        | "per_panel"
        | "cable_dc_m"
        | "cable_ac_m"
      quote_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "sent"
        | "accepted"
        | "rejected"
        | "expired"
        | "superseded"
        | "cancelled"
      roof_direction:
        | "north"
        | "north_east"
        | "east"
        | "south_east"
        | "south"
        | "south_west"
        | "west"
        | "north_west"
        | "flat"
      roof_type:
        | "rcc_flat"
        | "sloped_metal"
        | "sloped_tile"
        | "asbestos"
        | "other"
      scan_result:
        | "accepted"
        | "rejected_unknown"
        | "rejected_wrong_product"
        | "rejected_wrong_order"
        | "rejected_reserved_other"
        | "rejected_duplicate"
        | "rejected_bad_status"
        | "rejected_other"
      share_kind:
        | "quote"
        | "tracker"
        | "asset"
        | "report"
        | "delivery"
        | "signature"
      signature_status: "pending" | "signed" | "refused" | "remote_pending"
      stock_unit_status:
        | "in_stock"
        | "reserved"
        | "dispatched"
        | "delivered"
        | "installed"
        | "returned"
        | "under_repair"
        | "damaged"
        | "rma"
        | "replaced"
        | "scrapped"
      subsidy_status:
        | "not_applicable"
        | "registration_pending"
        | "awaiting_installation"
        | "docs_pending"
        | "inspection_pending"
        | "commissioned"
        | "claim_pending"
        | "credited"
        | "rejected"
      survey_status:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "rework_requested"
      system_type: "on_grid" | "off_grid"
      ticket_billing:
        | "not_applicable"
        | "pending"
        | "invoiced"
        | "paid"
        | "waived"
      ticket_channel: "phone" | "whatsapp" | "web" | "qr" | "walk_in" | "other"
      ticket_priority: "low" | "normal" | "high" | "urgent"
      ticket_status:
        | "open"
        | "triaged"
        | "visit_scheduled"
        | "in_progress"
        | "waiting_part"
        | "rma"
        | "awaiting_confirmation"
        | "closed"
        | "cancelled"
      variation_status: "pending" | "approved" | "rejected"
      warranty_decision:
        | "unknown"
        | "in_warranty"
        | "out_of_warranty"
        | "goodwill"
        | "void"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      adjustment_status: ["pending", "approved", "rejected"],
      app_role: [
        "director",
        "manager",
        "sales",
        "technician",
        "warehouse",
        "support",
        "accounts",
      ],
      customer_type: ["residential", "commercial", "industrial"],
      dispatch_status: [
        "draft",
        "loading",
        "in_transit",
        "delivered",
        "partially_delivered",
        "returned",
        "cancelled",
      ],
      feasibility: ["feasible", "feasible_with_changes", "not_feasible"],
      invoice_kind: ["order", "service", "variation", "credit_note"],
      invoice_status: ["draft", "issued", "partially_paid", "paid", "void"],
      job_status: [
        "unscheduled",
        "scheduled",
        "in_progress",
        "awaiting_signature",
        "completed",
        "on_hold",
        "cancelled",
      ],
      job_type: ["survey", "install", "service"],
      lead_source: ["web", "call", "whatsapp", "walk_in", "referral", "other"],
      lead_status: [
        "new",
        "contacting",
        "follow_up",
        "converted",
        "unreachable",
        "disqualified",
        "lost",
      ],
      movement_type: [
        "received",
        "reserved",
        "unreserved",
        "issued",
        "returned",
        "adjusted_up",
        "adjusted_down",
      ],
      order_pay_status: [
        "unpaid",
        "partial",
        "advance_met",
        "paid",
        "overpaid",
      ],
      order_status: [
        "pending_payment",
        "confirmed",
        "in_fulfilment",
        "delivered",
        "completed",
        "cancelled",
      ],
      pay_model: ["hourly", "per_job", "salaried"],
      pay_period_status: ["open", "locked", "approved", "paid"],
      payment_kind: ["advance", "balance", "full", "service", "refund"],
      payment_method: [
        "upi",
        "cash",
        "bank_transfer",
        "cheque",
        "card",
        "other",
      ],
      payment_status: ["pending", "received", "failed", "reversed", "bounced"],
      photo_kind: [
        "survey_roof",
        "survey_meter",
        "survey_db",
        "survey_obstruction",
        "before",
        "panels",
        "inverter",
        "earthing",
        "db_box",
        "meter",
        "serial_label",
        "power_test",
        "finished",
        "other",
      ],
      pick_status: ["pending", "picking", "packed", "dispatched", "cancelled"],
      product_category: [
        "panel",
        "inverter",
        "battery",
        "charge_controller",
        "structure",
        "cable",
        "protection",
        "earthing",
        "connector",
        "junction_box",
        "accessory",
        "service",
      ],
      project_stage: [
        "qualified",
        "survey_scheduled",
        "survey_submitted",
        "survey_approved",
        "quoted",
        "awaiting_payment",
        "order_confirmed",
        "dispatched",
        "delivered",
        "installed",
        "commissioned",
        "completed",
        "on_hold",
        "cancelled",
      ],
      qty_rounding: ["ceil", "round", "none"],
      qty_rule: [
        "fixed",
        "per_kw",
        "panel_count",
        "per_panel",
        "cable_dc_m",
        "cable_ac_m",
      ],
      quote_status: [
        "draft",
        "pending_approval",
        "approved",
        "sent",
        "accepted",
        "rejected",
        "expired",
        "superseded",
        "cancelled",
      ],
      roof_direction: [
        "north",
        "north_east",
        "east",
        "south_east",
        "south",
        "south_west",
        "west",
        "north_west",
        "flat",
      ],
      roof_type: [
        "rcc_flat",
        "sloped_metal",
        "sloped_tile",
        "asbestos",
        "other",
      ],
      scan_result: [
        "accepted",
        "rejected_unknown",
        "rejected_wrong_product",
        "rejected_wrong_order",
        "rejected_reserved_other",
        "rejected_duplicate",
        "rejected_bad_status",
        "rejected_other",
      ],
      share_kind: [
        "quote",
        "tracker",
        "asset",
        "report",
        "delivery",
        "signature",
      ],
      signature_status: ["pending", "signed", "refused", "remote_pending"],
      stock_unit_status: [
        "in_stock",
        "reserved",
        "dispatched",
        "delivered",
        "installed",
        "returned",
        "under_repair",
        "damaged",
        "rma",
        "replaced",
        "scrapped",
      ],
      subsidy_status: [
        "not_applicable",
        "registration_pending",
        "awaiting_installation",
        "docs_pending",
        "inspection_pending",
        "commissioned",
        "claim_pending",
        "credited",
        "rejected",
      ],
      survey_status: [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "rework_requested",
      ],
      system_type: ["on_grid", "off_grid"],
      ticket_billing: [
        "not_applicable",
        "pending",
        "invoiced",
        "paid",
        "waived",
      ],
      ticket_channel: ["phone", "whatsapp", "web", "qr", "walk_in", "other"],
      ticket_priority: ["low", "normal", "high", "urgent"],
      ticket_status: [
        "open",
        "triaged",
        "visit_scheduled",
        "in_progress",
        "waiting_part",
        "rma",
        "awaiting_confirmation",
        "closed",
        "cancelled",
      ],
      variation_status: ["pending", "approved", "rejected"],
      warranty_decision: [
        "unknown",
        "in_warranty",
        "out_of_warranty",
        "goodwill",
        "void",
      ],
    },
  },
} as const
