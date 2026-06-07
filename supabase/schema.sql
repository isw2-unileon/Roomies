


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."apartment_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "position" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."apartment_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."apartments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "address" "text" NOT NULL,
    "area" "text",
    "total_spots" integer NOT NULL,
    "occupied_spots" integer DEFAULT 0 NOT NULL,
    "base_rent" integer NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "latitude" double precision,
    "longitude" double precision,
    "bathrooms" integer,
    "surface_m2" integer,
    "floor" integer,
    "smoking_allowed" boolean DEFAULT true,
    "pets_allowed" boolean DEFAULT true,
    "students_allowed" boolean DEFAULT true,
    "notes" "text",
    "available_spots" integer,
    CONSTRAINT "apartments_status_check" CHECK (("status" = ANY (ARRAY['AVAILABLE'::"text", 'PARTIALLY_OCCUPIED'::"text", 'FULL'::"text", 'CLOSED'::"text", 'HIDDEN'::"text"])))
);


ALTER TABLE "public"."apartments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "group_id" "uuid",
    "type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "owner_confirmed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "applications_check" CHECK (((("tenant_id" IS NOT NULL) AND ("group_id" IS NULL)) OR (("tenant_id" IS NULL) AND ("group_id" IS NOT NULL)))),
    CONSTRAINT "applications_status_check" CHECK (("status" = ANY (ARRAY['PENDING_OWNER'::"text", 'REJECTED_BY_OWNER'::"text", 'FULLY_CONFIRMED'::"text", 'CANCELLED'::"text"]))),
    CONSTRAINT "applications_type_check" CHECK (("type" = ANY (ARRAY['individual'::"text", 'group'::"text"])))
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "invited_user_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "responded_at" timestamp with time zone,
    CONSTRAINT "group_invitations_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'ACCEPTED'::"text", 'REJECTED'::"text", 'EXPIRED'::"text"])))
);


ALTER TABLE "public"."group_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_join_request_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_id" "uuid" NOT NULL,
    "voter_user_id" "uuid" NOT NULL,
    "decision" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "group_join_request_votes_decision_check" CHECK (("decision" = ANY (ARRAY['APPROVE'::"text", 'REJECT'::"text"])))
);


ALTER TABLE "public"."group_join_request_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_join_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "requester_user_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'DIRECT_REQUEST'::"text" NOT NULL,
    CONSTRAINT "group_join_requests_source_check" CHECK (("source" = ANY (ARRAY['DIRECT_REQUEST'::"text", 'GROUP_INVITATION'::"text"]))),
    CONSTRAINT "group_join_requests_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'APPROVED'::"text", 'REJECTED'::"text", 'CANCELLED'::"text"])))
);


ALTER TABLE "public"."group_join_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "status" "text" NOT NULL,
    "joined_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "member_accepted" boolean DEFAULT false NOT NULL,
    CONSTRAINT "group_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'member'::"text"]))),
    CONSTRAINT "group_members_status_check" CHECK (("status" = ANY (ARRAY['INVITED'::"text", 'ACCEPTED'::"text", 'REJECTED'::"text", 'LEFT'::"text"])))
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "name" "text",
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "apartment_id" "uuid",
    "owner_accepted" boolean DEFAULT false NOT NULL,
    CONSTRAINT "groups_status_check" CHECK (("status" = ANY (ARRAY['FORMING'::"text", 'READY'::"text", 'APPLIED'::"text", 'ACCEPTED'::"text", 'REJECTED'::"text", 'CLOSED'::"text"])))
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid",
    "apartment_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read_at" timestamp with time zone,
    "group_id" "uuid"
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."owner_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "phone" "text",
    "verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."owner_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "budget_max" integer,
    "preferred_area" "text",
    "smoking" boolean DEFAULT false,
    "pets" boolean DEFAULT false,
    "age" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sex" "text",
    "tenant_situation" "text",
    "degree" "text",
    "profession" "text",
    "socialization_level" "text",
    "nightlife_level" "text",
    CONSTRAINT "tenant_profiles_nightlife_level_check" CHECK ((("nightlife_level" IS NULL) OR ("nightlife_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"])))),
    CONSTRAINT "tenant_profiles_sex_check" CHECK ((("sex" IS NULL) OR ("sex" = ANY (ARRAY['male'::"text", 'female'::"text", 'other'::"text", 'prefer_not_to_say'::"text"])))),
    CONSTRAINT "tenant_profiles_socialization_level_check" CHECK ((("socialization_level" IS NULL) OR ("socialization_level" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"])))),
    CONSTRAINT "tenant_profiles_tenant_situation_check" CHECK ((("tenant_situation" IS NULL) OR ("tenant_situation" = ANY (ARRAY['student'::"text", 'worker'::"text", 'unemployed'::"text"]))))
);


ALTER TABLE "public"."tenant_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "avatar_url" "text",
    "role" "text" NOT NULL,
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['tenant'::"text", 'owner'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."apartment_photos"
    ADD CONSTRAINT "apartment_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_join_request_votes"
    ADD CONSTRAINT "group_join_request_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_join_request_votes"
    ADD CONSTRAINT "group_join_request_votes_request_id_voter_user_id_key" UNIQUE ("request_id", "voter_user_id");



ALTER TABLE ONLY "public"."group_join_requests"
    ADD CONSTRAINT "group_join_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_user_id_key" UNIQUE ("group_id", "user_id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owner_profiles"
    ADD CONSTRAINT "owner_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owner_profiles"
    ADD CONSTRAINT "owner_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."tenant_profiles"
    ADD CONSTRAINT "tenant_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_profiles"
    ADD CONSTRAINT "tenant_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_apartments_owner_id" ON "public"."apartments" USING "btree" ("owner_id");



CREATE INDEX "idx_applications_apartment_id" ON "public"."applications" USING "btree" ("apartment_id");



CREATE UNIQUE INDEX "idx_applications_group_active_unique" ON "public"."applications" USING "btree" ("apartment_id", "group_id") WHERE (("group_id" IS NOT NULL) AND ("status" = ANY (ARRAY['PENDING_OWNER'::"text", 'PENDING_CONFIRMED_TENANTS'::"text"])));



CREATE INDEX "idx_applications_group_id" ON "public"."applications" USING "btree" ("group_id");



CREATE UNIQUE INDEX "idx_applications_individual_active_unique" ON "public"."applications" USING "btree" ("apartment_id", "tenant_id") WHERE (("tenant_id" IS NOT NULL) AND ("status" = ANY (ARRAY['PENDING_OWNER'::"text", 'PENDING_CONFIRMED_TENANTS'::"text"])));



CREATE INDEX "idx_applications_tenant_id" ON "public"."applications" USING "btree" ("tenant_id");



CREATE INDEX "idx_group_invitations_group_id" ON "public"."group_invitations" USING "btree" ("group_id");



CREATE INDEX "idx_group_invitations_group_user_status" ON "public"."group_invitations" USING "btree" ("group_id", "invited_user_id", "status");



CREATE INDEX "idx_group_invitations_invited_user_id" ON "public"."group_invitations" USING "btree" ("invited_user_id");



CREATE INDEX "idx_group_invitations_status" ON "public"."group_invitations" USING "btree" ("status");



CREATE INDEX "idx_group_join_request_votes_request_id" ON "public"."group_join_request_votes" USING "btree" ("request_id");



CREATE INDEX "idx_group_join_request_votes_voter_user_id" ON "public"."group_join_request_votes" USING "btree" ("voter_user_id");



CREATE INDEX "idx_group_join_requests_group_id" ON "public"."group_join_requests" USING "btree" ("group_id");



CREATE UNIQUE INDEX "idx_group_join_requests_pending_unique" ON "public"."group_join_requests" USING "btree" ("group_id", "requester_user_id") WHERE ("status" = 'PENDING'::"text");



CREATE INDEX "idx_group_join_requests_requester_user_id" ON "public"."group_join_requests" USING "btree" ("requester_user_id");



CREATE INDEX "idx_group_join_requests_source" ON "public"."group_join_requests" USING "btree" ("source");



CREATE INDEX "idx_group_join_requests_status" ON "public"."group_join_requests" USING "btree" ("status");



CREATE INDEX "idx_group_members_group_id" ON "public"."group_members" USING "btree" ("group_id");



CREATE INDEX "idx_group_members_group_user_status" ON "public"."group_members" USING "btree" ("group_id", "user_id", "status");



CREATE INDEX "idx_group_members_status" ON "public"."group_members" USING "btree" ("status");



CREATE INDEX "idx_group_members_user_id" ON "public"."group_members" USING "btree" ("user_id");



CREATE INDEX "idx_groups_apartment_id" ON "public"."groups" USING "btree" ("apartment_id");



CREATE INDEX "idx_groups_created_by" ON "public"."groups" USING "btree" ("created_by");



CREATE INDEX "idx_groups_status" ON "public"."groups" USING "btree" ("status");



CREATE INDEX "idx_messages_apartment_id" ON "public"."messages" USING "btree" ("apartment_id");



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("apartment_id", "sender_id", "receiver_id", "created_at" DESC);



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_group_id" ON "public"."messages" USING "btree" ("group_id", "created_at" DESC);



CREATE INDEX "idx_messages_receiver_id" ON "public"."messages" USING "btree" ("receiver_id");



CREATE INDEX "idx_messages_sender_id" ON "public"."messages" USING "btree" ("sender_id");



CREATE OR REPLACE TRIGGER "update_apartments_updated_at" BEFORE UPDATE ON "public"."apartments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_applications_updated_at" BEFORE UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_groups_updated_at" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_owner_profiles_updated_at" BEFORE UPDATE ON "public"."owner_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tenant_profiles_updated_at" BEFORE UPDATE ON "public"."tenant_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."apartment_photos"
    ADD CONSTRAINT "apartment_photos_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_invited_user_id_fkey" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_join_request_votes"
    ADD CONSTRAINT "group_join_request_votes_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."group_join_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_join_request_votes"
    ADD CONSTRAINT "group_join_request_votes_voter_user_id_fkey" FOREIGN KEY ("voter_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_join_requests"
    ADD CONSTRAINT "group_join_requests_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_join_requests"
    ADD CONSTRAINT "group_join_requests_requester_user_id_fkey" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owner_profiles"
    ADD CONSTRAINT "owner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_profiles"
    ADD CONSTRAINT "tenant_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."apartment_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."apartments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_join_request_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_join_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."owner_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenant_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."apartment_photos" TO "anon";
GRANT ALL ON TABLE "public"."apartment_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."apartment_photos" TO "service_role";



GRANT ALL ON TABLE "public"."apartments" TO "anon";
GRANT ALL ON TABLE "public"."apartments" TO "authenticated";
GRANT ALL ON TABLE "public"."apartments" TO "service_role";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."group_invitations" TO "anon";
GRANT ALL ON TABLE "public"."group_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."group_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."group_join_request_votes" TO "anon";
GRANT ALL ON TABLE "public"."group_join_request_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."group_join_request_votes" TO "service_role";



GRANT ALL ON TABLE "public"."group_join_requests" TO "anon";
GRANT ALL ON TABLE "public"."group_join_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."group_join_requests" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."owner_profiles" TO "anon";
GRANT ALL ON TABLE "public"."owner_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."owner_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_profiles" TO "anon";
GRANT ALL ON TABLE "public"."tenant_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







