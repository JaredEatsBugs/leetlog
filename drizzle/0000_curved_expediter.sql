CREATE TYPE "public"."attempt_result" AS ENUM('solo', 'hint', 'solution');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"problem_id" integer NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"result" "attempt_result" NOT NULL,
	"duration_minutes" smallint,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "problems_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"frontend_id" integer,
	"title" text NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "problems_slug_unique" UNIQUE("slug"),
	CONSTRAINT "problems_frontend_id_unique" UNIQUE("frontend_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp with time zone,
	"image" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"day_start_hour" smallint DEFAULT 4 NOT NULL,
	"daily_goal" smallint DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attempts_user_time_idx" ON "attempts" USING btree ("user_id","attempted_at");--> statement-breakpoint
CREATE INDEX "attempts_user_problem_idx" ON "attempts" USING btree ("user_id","problem_id");