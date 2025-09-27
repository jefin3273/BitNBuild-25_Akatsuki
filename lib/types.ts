// lib/types.ts
export type UserRole = "client" | "freelancer";

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: number;
                    name: string;
                    email: string;
                    role: UserRole;
                    university_id: number | null;
                    is_verified_student: boolean | null;
                    created_at: string;
                };
                Insert: {
                    id?: number;
                    name: string;
                    email: string;
                    role: UserRole;
                    university_id?: number | null;
                    is_verified_student?: boolean | null;
                    created_at?: string;
                };
                Update: {
                    id?: number;
                    name?: string;
                    email?: string;
                    role?: UserRole;
                    university_id?: number | null;
                    is_verified_student?: boolean | null;
                    created_at?: string;
                };
            };
            universities: {
                Row: {
                    id: number;
                    name: string;
                    created_at: string;
                };
                Insert: {
                    id?: number;
                    name: string;
                    created_at?: string;
                };
                Update: {
                    id?: number;
                    name?: string;
                    created_at?: string;
                };
            };
        };
    };
}