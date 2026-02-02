export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            channel_read_status: {
                Row: {
                    channel_id: string
                    last_read_at: string
                    user_id: string
                }
                Insert: {
                    channel_id: string
                    last_read_at?: string
                    user_id: string
                }
                Update: {
                    channel_id?: string
                    last_read_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "channel_read_status_channel_id_fkey"
                        columns: ["channel_id"]
                        isOneToOne: false
                        referencedRelation: "channels"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "channel_read_status_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            channels: {
                Row: {
                    created_at: string | null
                    created_by: string | null
                    description: string | null
                    id: string
                    is_private: boolean | null
                    name: string
                    type: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    id?: string
                    is_private?: boolean | null
                    name: string
                    type?: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    id?: string
                    is_private?: boolean | null
                    name?: string
                    type?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "channels_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            dm_read_status: {
                Row: {
                    last_read_at: string
                    partner_id: string
                    user_id: string
                }
                Insert: {
                    last_read_at?: string
                    partner_id: string
                    user_id: string
                }
                Update: {
                    last_read_at?: string
                    partner_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "dm_read_status_partner_id_fkey"
                        columns: ["partner_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "dm_read_status_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            file_comments: {
                Row: {
                    content: string
                    created_at: string
                    file_id: string
                    id: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    content: string
                    created_at?: string
                    file_id: string
                    id?: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    content?: string
                    created_at?: string
                    file_id?: string
                    id?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "file_comments_file_id_fkey"
                        columns: ["file_id"]
                        isOneToOne: false
                        referencedRelation: "files"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "file_comments_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            file_reactions: {
                Row: {
                    created_at: string
                    emoji: string
                    file_id: string
                    id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    emoji: string
                    file_id: string
                    id?: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    emoji?: string
                    file_id?: string
                    id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "file_reactions_file_id_fkey"
                        columns: ["file_id"]
                        isOneToOne: false
                        referencedRelation: "files"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "file_reactions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            files: {
                Row: {
                    channel_id: string | null
                    created_at: string
                    description: string | null
                    display_name: string
                    download_count: number | null
                    file_size: number
                    file_type: string
                    id: string
                    original_filename: string
                    storage_path: string
                    thumbnail_path: string | null
                    updated_at: string
                    uploader_id: string
                }
                Insert: {
                    channel_id?: string | null
                    created_at?: string
                    description?: string | null
                    display_name: string
                    download_count?: number | null
                    file_size: number
                    file_type: string
                    id?: string
                    original_filename: string
                    storage_path: string
                    thumbnail_path?: string | null
                    updated_at?: string
                    uploader_id: string
                }
                Update: {
                    channel_id?: string | null
                    created_at?: string
                    description?: string | null
                    display_name?: string
                    download_count?: number | null
                    file_size?: number
                    file_type?: string
                    id?: string
                    original_filename?: string
                    storage_path?: string
                    thumbnail_path?: string | null
                    updated_at?: string
                    uploader_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "files_channel_id_fkey"
                        columns: ["channel_id"]
                        isOneToOne: false
                        referencedRelation: "channels"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "files_uploader_id_fkey"
                        columns: ["uploader_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            global_alerts: {
                Row: {
                    created_at: string | null
                    created_by: string | null
                    expired_at: string | null
                    id: string
                    is_active: boolean | null
                    message: string
                    type: string
                }
                Insert: {
                    created_at?: string | null
                    created_by?: string | null
                    expired_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    message: string
                    type?: string
                }
                Update: {
                    created_at?: string | null
                    created_by?: string | null
                    expired_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    message?: string
                    type?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "global_alerts_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            message_reactions: {
                Row: {
                    created_at: string | null
                    emoji: string
                    id: string
                    message_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    emoji: string
                    id?: string
                    message_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    emoji?: string
                    id?: string
                    message_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "message_reactions_message_id_fkey"
                        columns: ["message_id"]
                        isOneToOne: false
                        referencedRelation: "messages"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "message_reactions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            messages: {
                Row: {
                    channel_id: string | null
                    content: string
                    edited_at: string | null
                    id: string
                    pinned: boolean | null
                    pinned_at: string | null
                    pinned_by: string | null
                    pinned_by_username: string | null
                    recipient_id: string | null
                    reply_to_id: string | null
                    sent_at: string | null
                    user_id: string
                    username: string | null
                }
                Insert: {
                    channel_id?: string | null
                    content: string
                    edited_at?: string | null
                    id?: string
                    pinned?: boolean | null
                    pinned_at?: string | null
                    pinned_by?: string | null
                    pinned_by_username?: string | null
                    recipient_id?: string | null
                    reply_to_id?: string | null
                    sent_at?: string | null
                    user_id: string
                    username?: string | null
                }
                Update: {
                    channel_id?: string | null
                    content?: string
                    edited_at?: string | null
                    id?: string
                    pinned?: boolean | null
                    pinned_at?: string | null
                    pinned_by?: string | null
                    pinned_by_username?: string | null
                    recipient_id?: string | null
                    reply_to_id?: string | null
                    sent_at?: string | null
                    user_id?: string
                    username?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_channel_id_fkey"
                        columns: ["channel_id"]
                        isOneToOne: false
                        referencedRelation: "channels"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "messages_pinned_by_fkey"
                        columns: ["pinned_by"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "messages_recipient_id_fkey"
                        columns: ["recipient_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "messages_reply_to_id_fkey"
                        columns: ["reply_to_id"]
                        isOneToOne: false
                        referencedRelation: "messages"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "messages_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            online_members: {
                Row: {
                    is_online: boolean | null
                    last_seen: string | null
                    user_id: string
                    username: string | null
                }
                Insert: {
                    is_online?: boolean | null
                    last_seen?: string | null
                    user_id: string
                    username?: string | null
                }
                Update: {
                    is_online?: boolean | null
                    last_seen?: string | null
                    user_id?: string
                    username?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "online_members_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            users: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    dob: string | null
                    email: string | null
                    focus_streak: number | null
                    id: string
                    last_active_date: string | null
                    last_focus_date: string | null
                    role: string
                    today_minutes: number | null
                    updated_at: string | null
                    username: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    dob?: string | null
                    email?: string | null
                    focus_streak?: number | null
                    id: string
                    last_active_date?: string | null
                    last_focus_date?: string | null
                    role?: string
                    today_minutes?: number | null
                    updated_at?: string | null
                    username?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    dob?: string | null
                    email?: string | null
                    focus_streak?: number | null
                    id?: string
                    last_active_date?: string | null
                    last_focus_date?: string | null
                    role?: string
                    today_minutes?: number | null
                    updated_at?: string | null
                    username?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            user_role_details: {
                Row: {
                    email: string | null
                    role_color: string | null
                    role_display_name: string | null
                    role_emoji: string | null
                    role_name: string | null
                    user_id: string | null
                    username: string | null
                }
            }
        }
        Functions: {
            get_unread_counts: {
                Args: {
                    p_user_id: string
                }
                Returns: Json
            }
            get_user_role: {
                Args: {
                    user_uuid: string
                }
                Returns: string
            }
            get_username_by_user_id: {
                Args: {
                    p_user_id: string
                }
                Returns: string
            }
            increment_unread_count: {
                Args: {
                    p_sender_id: string
                    p_user_id: string
                }
                Returns: undefined
            }
            make_tamizh_admin: {
                Args: never
                Returns: boolean
            }
            promote_user: {
                Args: {
                    new_role: string
                    target_user_id: string
                }
                Returns: boolean
            }
            set_user_offline: {
                Args: {
                    user_uuid: string
                }
                Returns: undefined
            }
            update_online_status: {
                Args: {
                    user_uuid: string
                }
                Returns: undefined
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
