--
-- PostgreSQL database dump
--

\restrict G587iwnnoe1B9YCtUsO9Mg9rrVymPIpG092LQVIKGvkjWmLj87uhTP3Wd6P3XBb

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

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

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: achievement_definitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.achievement_definitions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    condition_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    reward_stars integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.achievement_definitions OWNER TO postgres;

--
-- Name: avatars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.avatars (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    filename character varying(100) NOT NULL,
    category character varying(30) DEFAULT 'cartoon'::character varying,
    url character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.avatars OWNER TO postgres;

--
-- Name: exchange_approvals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exchange_approvals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    exchange_id uuid NOT NULL,
    approver_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT exchange_approvals_action_check CHECK (((action)::text = ANY ((ARRAY['approve'::character varying, 'reject'::character varying])::text[])))
);


ALTER TABLE public.exchange_approvals OWNER TO postgres;

--
-- Name: exchange_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exchange_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    reward_id uuid NOT NULL,
    stars_spent integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    approved_by uuid,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT exchange_logs_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.exchange_logs OWNER TO postgres;

--
-- Name: family; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.family (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) DEFAULT '我的家庭'::character varying NOT NULL,
    code character varying(20) NOT NULL,
    owner_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.family OWNER TO postgres;

--
-- Name: goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    family_id uuid NOT NULL,
    user_id uuid,
    title character varying(100) NOT NULL,
    icon character varying(50) DEFAULT 'star'::character varying,
    difficulty integer DEFAULT 10,
    star_target integer DEFAULT 10,
    current_stars integer DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT goals_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'abandoned'::character varying])::text[])))
);


ALTER TABLE public.goals OWNER TO postgres;

--
-- Name: point_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.point_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    balance_after integer NOT NULL,
    type character varying(30) NOT NULL,
    source character varying(50) NOT NULL,
    source_id uuid,
    description character varying(200),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.point_logs OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: rewards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rewards (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    family_id uuid NOT NULL,
    title character varying(100) NOT NULL,
    icon character varying(50) DEFAULT 'gift'::character varying,
    star_cost integer NOT NULL,
    rarity character varying(20) DEFAULT 'normal'::character varying,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rewards_rarity_check CHECK (((rarity)::text = ANY ((ARRAY['normal'::character varying, 'epic'::character varying, 'legend'::character varying])::text[])))
);


ALTER TABLE public.rewards OWNER TO postgres;

--
-- Name: spin_wheel_prizes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.spin_wheel_prizes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    prize_type character varying(50) NOT NULL,
    prize_value integer DEFAULT 0,
    sticker_id uuid,
    weight integer DEFAULT 1,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    emoji character varying(50) DEFAULT '🎁'::character varying,
    CONSTRAINT spin_wheel_prizes_prize_type_check CHECK (((prize_type)::text = ANY ((ARRAY['stars'::character varying, 'sticker'::character varying, 'none'::character varying])::text[])))
);


ALTER TABLE public.spin_wheel_prizes OWNER TO postgres;

--
-- Name: stickers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stickers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    emoji character varying(50) DEFAULT '⭐'::character varying,
    rarity character varying(20) NOT NULL,
    description character varying(500) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT stickers_rarity_check CHECK (((rarity)::text = ANY ((ARRAY['N'::character varying, 'R'::character varying, 'SR'::character varying, 'SSR'::character varying])::text[])))
);


ALTER TABLE public.stickers OWNER TO postgres;

--
-- Name: task_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    task_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    stars_earned integer DEFAULT 0,
    completed_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    approval_status character varying(20) DEFAULT 'approved'::character varying,
    task_type character varying(20) DEFAULT 'normal'::character varying,
    CONSTRAINT task_logs_action_check CHECK (((action)::text = ANY (ARRAY[('complete'::character varying)::text, ('skip'::character varying)::text, ('skipped'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text, ('punishment'::character varying)::text])))
);


ALTER TABLE public.task_logs OWNER TO postgres;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    family_id uuid NOT NULL,
    goal_id uuid,
    title character varying(100) NOT NULL,
    icon character varying(50) DEFAULT 'todo-o'::character varying,
    star_reward integer DEFAULT 1,
    rarity character varying(20) DEFAULT 'N'::character varying,
    frequency character varying(20) DEFAULT 'daily'::character varying,
    frequency_count integer DEFAULT 1,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    last_reset_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tasks_frequency_check CHECK (((frequency)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'special'::character varying, 'once'::character varying])::text[]))),
    CONSTRAINT tasks_rarity_check CHECK (((rarity)::text = ANY ((ARRAY['N'::character varying, 'R'::character varying, 'SR'::character varying, 'SSR'::character varying])::text[])))
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_achievements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    achievement_id uuid NOT NULL,
    progress integer DEFAULT 0,
    unlocked_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_achievements OWNER TO postgres;

--
-- Name: user_daily_spins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_daily_spins (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    spin_date date NOT NULL,
    spins_used integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    prize_id uuid,
    prize_name character varying(100)
);


ALTER TABLE public.user_daily_spins OWNER TO postgres;

--
-- Name: user_display_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_display_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    equipped_stickers uuid[] DEFAULT '{}'::uuid[],
    equipped_achievements uuid[] DEFAULT '{}'::uuid[],
    theme_color character varying(20) DEFAULT 'pink'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    equipped_achievement_id uuid,
    equipped_sticker_id uuid,
    equipped_sticker1_id uuid,
    equipped_sticker2_id uuid,
    pet character varying(50) DEFAULT 'rabbit'::character varying,
    theme character varying(20) DEFAULT 'pink'::character varying,
    avatar_id uuid
);


ALTER TABLE public.user_display_settings OWNER TO postgres;

--
-- Name: user_pets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_pets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    pet_type character varying(50) DEFAULT 'rabbit'::character varying,
    pet_mood character varying(20) DEFAULT 'neutral'::character varying,
    pet_level integer DEFAULT 1,
    last_interaction timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hunger integer DEFAULT 100,
    cleanliness integer DEFAULT 100,
    mood integer DEFAULT 100
);


ALTER TABLE public.user_pets OWNER TO postgres;

--
-- Name: user_point_summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_point_summary (
    user_id uuid NOT NULL,
    total_earned integer DEFAULT 0,
    total_used integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_point_summary OWNER TO postgres;

--
-- Name: user_signins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_signins (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    sign_date date NOT NULL,
    stars_earned integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    bonus_stars integer DEFAULT 0,
    streak_days integer DEFAULT 0
);


ALTER TABLE public.user_signins OWNER TO postgres;

--
-- Name: user_stickers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_stickers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    sticker_id uuid,
    earned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_stickers OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    family_id uuid,
    phone character varying(20),
    password_hash character varying(255),
    nickname character varying(50) NOT NULL,
    avatar character varying(500) DEFAULT ''::character varying,
    role character varying(20) DEFAULT 'child'::character varying,
    level integer DEFAULT 1,
    stars integer DEFAULT 0,
    wish_points integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    openid character varying(100),
    total_stars integer DEFAULT 0,
    version integer DEFAULT 1,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'parent'::character varying, 'child'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: weekly_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.weekly_reports (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    week_start date NOT NULL,
    week_end date NOT NULL,
    tasks_completed integer DEFAULT 0,
    stars_earned integer DEFAULT 0,
    tasks_detail jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data jsonb DEFAULT '{}'::jsonb,
    viewed boolean DEFAULT false
);


ALTER TABLE public.weekly_reports OWNER TO postgres;

--
-- Data for Name: achievement_definitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.achievement_definitions (id, type, name, description, condition_data, reward_stars, created_at) FROM stdin;
8e35f225-7295-4821-a5d9-2caca8382ac1	task_count_10	小试牛刀	累计完成10个任务	{"count": 10}	5	2026-03-23 15:27:44.208294
911e0bdb-3d1f-4dbf-ab56-f3db5529119d	task_count_50	任务达人	累计完成50个任务	{"count": 50}	15	2026-03-23 15:27:44.208294
703ce069-e9c9-4419-bc3e-03d4b1a4cbc0	task_count_100	任务之王	累计完成100个任务	{"count": 100}	30	2026-03-23 15:27:44.208294
bd9f1a2f-a335-4bcc-b968-cf263fc95f70	star_total_50	星星收藏家	累计获得50颗星星	{"count": 50}	10	2026-03-23 15:27:44.208294
ee03c4d1-b8df-47de-a310-18ce8f82e305	star_total_200	星星富翁	累计获得200颗星星	{"count": 200}	30	2026-03-23 15:27:44.208294
c465f415-015b-4b6c-93dd-a54bae718912	goal_completed_1	初达成	完成第1个目标	{"count": 1}	20	2026-03-23 15:27:44.208294
3674185d-f4d6-44cf-9e1a-af3a454b68a0	goal_completed_3	目标达成者	完成3个目标	{"count": 3}	50	2026-03-23 15:27:44.208294
877c0900-f486-42be-a364-991199d81671	level_5	五级玩家	达到5级	{"level": 5}	25	2026-03-23 15:27:44.208294
ac823d75-47f4-446b-85ae-0e79ec336666	level_10	十级玩家	达到10级	{"level": 10}	50	2026-03-23 15:27:44.208294
a1000001-0000-0000-0000-000000000006	sticker_count_10	贴纸新手	收集10张贴纸	{"threshold": 10}	3	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000007	sticker_count_20	贴纸达人	收集20张贴纸	{"threshold": 20}	5	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000008	sticker_count_30	贴纸收藏家	收集30张贴纸	{"threshold": 30}	10	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000009	login_streak_3	连续登录3天	连续登录3天	{"threshold": 3}	3	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000010	login_streak_7	连续登录7天	连续登录7天	{"threshold": 7}	7	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000011	task_streak_3	连续任务3天	连续3天完成任务	{"threshold": 3}	3	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000012	task_streak_7	连续任务7天	连续7天完成任务	{"threshold": 7}	7	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000013	exchange_count_1	首次兑换	完成首次奖励兑换	{"threshold": 1}	2	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000014	special_task_1	特殊任务完成	完成1个特殊任务	{"threshold": 1}	5	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000015	early_bird	早起鸟	在早上8点前完成任务	{}	2	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000016	night_owl	夜猫子	在晚上10点后完成任务	{}	2	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000017	streak_task_7	连续7天单任务	同一任务连续完成7天	{"threshold": 7}	5	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000018	streak_task_15	连续15天单任务	同一任务连续完成15天	{"threshold": 15}	10	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000019	streak_task_30	连续30天单任务	同一任务连续完成30天	{"threshold": 30}	20	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000020	streak_task_60	连续60天单任务	同一任务连续完成60天	{"threshold": 60}	30	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000021	count_task_10	单项任务10次	同一个任务累计完成10次	{"threshold": 10}	3	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000022	count_task_30	单项任务30次	同一个任务累计完成30次	{"threshold": 30}	7	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000023	count_task_60	单项任务60次	同一个任务累计完成60次	{"threshold": 60}	15	2026-03-23 15:31:30.953487
a1000001-0000-0000-0000-000000000024	count_task_100	单项任务100次	同一个任务累计完成100次	{"threshold": 100}	25	2026-03-23 15:31:30.953487
\.


--
-- Data for Name: avatars; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.avatars (id, name, filename, category, url, is_active, created_at) FROM stdin;
fd17d9d8-04a9-47da-956b-bc6435b75019	小猪佩奇	peppa.jpg	peppa	\N	t	2026-03-23 17:39:21.67609
a1000086-3d8c-44a2-b60f-6b8f8058e8c4	汪汪队-Chase	chase.jpg	pawpatrol	\N	t	2026-03-23 17:39:21.67609
f25a8183-32ec-4cbe-a89b-47777c993b78	汪汪队-Marshall	marshall.jpg	pawpatrol	\N	t	2026-03-23 17:39:21.67609
6fe69498-5e2e-4e81-836e-c8580eecdd62	冰雪奇缘-Elsa	elsa.jpg	disney	\N	t	2026-03-23 17:39:21.67609
cb0daaf9-bffd-453e-af16-76c423a4e457	美女与野兽-Belle	belle.jpg	disney	\N	t	2026-03-23 17:39:21.67609
3a85ebb5-ec69-42ec-ae4a-1eda1a417427	灰姑娘-Cinderella	cinderella.jpg	disney	\N	t	2026-03-23 17:39:21.67609
249cd9c1-8e3b-40c9-9613-360cc3ea4080	海洋奇缘-Moana	moana.jpg	disney	\N	t	2026-03-23 17:39:21.67609
8652fa4b-bd14-45fa-836e-d0a2c3c2bcca	公主与青蛙-Tiana	tiana.jpg	disney	\N	t	2026-03-23 17:39:21.67609
32ccad27-a1f6-4f37-8e3d-747c3bdcef90	长发公主-Rapunzel	rapunzel.jpg	disney	\N	t	2026-03-23 17:39:21.67609
fbfa0d2b-ff88-4b8f-aa5f-c45dd705664e	安娜公主	anna.jpg	cartoon	/avatars/anna.jpg	t	2026-03-24 15:36:13.338192
\.


--
-- Data for Name: exchange_approvals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exchange_approvals (id, exchange_id, approver_id, action, comment, created_at) FROM stdin;
\.


--
-- Data for Name: exchange_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exchange_logs (id, user_id, reward_id, stars_spent, status, approved_by, approved_at, created_at) FROM stdin;
\.


--
-- Data for Name: family; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.family (id, name, code, owner_id, created_at, updated_at) FROM stdin;
7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	我的家庭	VFAVAQ	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	2026-03-23 15:27:54.14208	2026-03-23 15:27:54.14208
26855fb8-aa11-4b45-a482-a1c0403ae69b	测试家庭	YT8P5J	\N	2026-03-24 15:25:21.68853	2026-03-24 15:25:21.68853
991aa133-2fcc-439d-a18e-79a17b8992bd	测试家庭	37R2C7	9e0b7bd8-c1da-4cbd-a625-4dfc080c2023	2026-03-24 15:25:37.446616	2026-03-24 15:25:37.446616
3fb433db-2ef2-4d6d-b470-c84c2000d17c	测试家庭	OM70MY	12b1397a-3cdb-43ad-b456-59139dbf242b	2026-03-24 15:25:45.912935	2026-03-24 15:25:45.912935
44527035-c1b5-4cea-a4e4-d1fa00674c57	测试家庭	NXA8DN	3347e255-7151-4758-9d02-cea86465d406	2026-03-24 15:25:56.123857	2026-03-24 15:25:56.123857
c0479a0d-d90d-41ef-8bd4-b2b63185f501	测试家庭	XD6C53	00e5b5fb-426e-4dd8-9841-e7644d6fd611	2026-03-24 15:26:08.442231	2026-03-24 15:26:08.442231
74455ffb-bf69-4349-8652-77eee218bbb1	测试家庭	MZ229Y	5cef9e9e-07bc-4452-a90c-55ce972629ad	2026-03-24 15:26:22.779831	2026-03-24 15:26:22.779831
1ff79cd4-8fc9-4fd9-999f-9363a9bb142d	测试家庭	Q8NDBP	37533c62-bc6a-4000-ada7-bbc052890db0	2026-03-24 15:26:37.317409	2026-03-24 15:26:37.317409
95c063d2-e102-44df-87e4-24ac77f055a0	测试家庭	934EZZ	5204dea9-3150-49d3-b5e5-73a0fd5fde21	2026-03-24 15:26:51.477332	2026-03-24 15:26:51.477332
8d60fd03-2f44-41c1-b23e-6ad72100856a	测试家庭	QCIY7D	765395e6-fd89-4d9c-b56b-64060f44663e	2026-03-24 15:27:06.391063	2026-03-24 15:27:06.391063
ed7381eb-9ce5-42c9-9a3f-257f98e15595	测试家庭	12RH9G	dadd4881-9de8-49f8-9689-140a1ba8306c	2026-03-24 15:28:26.04969	2026-03-24 15:28:26.04969
96211f28-a59d-4f8d-869f-7cbe400e5fc6	测试家庭	LEVOKS	6d115968-70c6-490e-a6ee-458c5a0de160	2026-03-24 15:28:57.606703	2026-03-24 15:28:57.606703
4fa70b1c-3d2b-4fbb-a38f-28e1696ad682	调试家庭	3TTUMQ	9f579014-d9f5-4443-bcc7-7477a6331c7c	2026-03-24 15:30:29.919247	2026-03-24 15:30:29.919247
b9b9861d-522f-4eb3-9873-ebb6d70abdc0	最终家庭	J7VSU6	2f02c8b1-af64-4483-9f0d-c19ac0663de1	2026-03-24 15:31:40.489163	2026-03-24 15:31:40.489163
7536d248-99c6-4c2e-9834-919a8e47590c	调试家庭2	GWI4A2	e381f929-c11c-4fe3-acd4-1925f36581be	2026-03-24 15:33:52.947905	2026-03-24 15:33:52.947905
b2ed8173-48d2-4225-95b1-0e34d91c0825	调试家庭3	IWHXJF	2d93810d-7314-4c35-9458-19580a18e961	2026-03-24 15:34:09.075094	2026-03-24 15:34:09.075094
153b7dc8-7440-4235-ba17-b402c93ef8e1	最终家庭	UQ4PN2	6ad599b8-1a95-42f8-a2b9-576033d89f55	2026-03-24 15:35:26.629869	2026-03-24 15:35:26.629869
7ffca93a-8981-4d5c-8006-06e6194763c4	调试家庭	F7K9B2	c289fe12-2c72-4587-9f66-a92d02b8658b	2026-03-24 15:36:37.306594	2026-03-24 15:36:37.306594
209b8e1e-7861-4425-8beb-4b2f859ed5b1	调试家庭4	XFNJXP	afcbdc83-ffde-4690-bd9c-cc6e93c67a91	2026-03-24 15:37:22.131595	2026-03-24 15:37:22.131595
c3b2a2f5-0b71-419e-b1d3-9a0052cf18bd	贴纸测试家庭	TT9J2Q	a168e9f9-0180-42d2-9ddf-b92a8c337edb	2026-03-24 15:44:08.976512	2026-03-24 15:44:08.976512
d499ef0f-0e42-46fa-90f1-f0ec9f90245a	贴纸测试家庭2	00I59C	5231d6d0-b641-4873-bbd5-dee25b338be6	2026-03-24 15:45:34.246135	2026-03-24 15:45:34.246135
f4eadecc-0d2c-464e-a655-bb0087543c04	快速家庭	EMTQ1L	271fdcc5-2734-488c-800e-a6396a2e469b	2026-03-24 15:47:24.942025	2026-03-24 15:47:24.942025
7dff0698-4379-4e1c-aea4-7c879758d9df	测试3	XHDASI	ce75ac0a-f5a4-48e2-bb94-1dda95b566e7	2026-03-24 15:49:42.135428	2026-03-24 15:49:42.135428
132359f5-c476-4b83-8bbf-0b156d5a33c9	积分测试家庭	34UROC	52b898d1-5e40-4914-9c6b-fde221cb9186	2026-03-24 16:12:32.296985	2026-03-24 16:12:32.296985
5d58bd89-6820-48a4-9db8-1bc7c2dd3ae4	审批测试家庭	D0363J	b4f23e07-d44a-4b13-8ade-77832b3d5cf6	2026-03-24 16:12:56.216636	2026-03-24 16:12:56.216636
5264a0dc-9320-4403-913f-e78941abc86b	完整测试家庭	15SAA3	f2df023e-7644-48c1-a948-7d987c41f1b6	2026-03-24 16:24:00.136827	2026-03-24 16:24:00.136827
\.


--
-- Data for Name: goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goals (id, family_id, user_id, title, icon, difficulty, star_target, current_stars, status, created_at, updated_at) FROM stdin;
dfdd9c34-2cd8-44ac-b17c-c40946d465ee	c0479a0d-d90d-41ef-8bd4-b2b63185f501	00e5b5fb-426e-4dd8-9841-e7644d6fd611	养成早起习惯	🌅	15	15	0	active	2026-03-24 15:26:08.573101	2026-03-24 15:26:08.573101
\.


--
-- Data for Name: point_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.point_logs (id, user_id, amount, balance_after, type, source, source_id, description, created_at) FROM stdin;
e0ff183a-5707-4f1c-86f4-523d68586c65	f2c2c916-3d74-4d06-bcce-62d2bb82ca0d	1	1	signin	signin	\N	签到获得 1 星星（连续1天）	2026-03-24 16:12:32.472204
fa7b12e3-407f-49c3-a1d9-4b960cc2065f	7fdb62ac-745a-4033-95bc-21bc69f693be	3	3	task_approve	task_approve	49a1bb8a-e0a8-4de8-b2ce-8f33dd53a244	完成任务「测试任务」获得 3 星星	2026-03-24 16:12:56.421766
0280d964-364c-4f7c-8f38-aee80fd2d7d0	a1a75f59-ef6b-4c38-bc41-beebf7365df2	1	1	signin	signin	\N	签到获得 1 星星（连续1天）	2026-03-24 16:24:00.318389
7aa5b374-f447-4b34-abdb-ec5d7ce6f10e	a1a75f59-ef6b-4c38-bc41-beebf7365df2	5	6	task_approve	task_approve	2436c0ee-da7c-4f85-a76a-d8370cf42492	完成任务「测试任务」获得 5 星星	2026-03-24 16:24:00.410836
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, user_id, token_hash, expires_at, created_at) FROM stdin;
bf82c5a6-edae-4f01-bc84-f9092160ad9e	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjc5Njc0LCJleHAiOjE3NzQ4ODQ0NzR9.LVxJIKJQ0Nhhpq7mcV-P5tmiuk8f7pNrhAnwDApRo7Y	2026-03-30 15:27:54.282071	2026-03-23 15:27:54.282071
f393b008-c88a-435a-8eef-309e633f9b07	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjc5NjkxLCJleHAiOjE3NzQ4ODQ0OTF9.qAmu_14Kt2AtQ27mXQy0nefsZ-bv1K8BwTSMoYXpWxc	2026-03-30 15:28:11.45253	2026-03-23 15:28:11.45253
37fa77f4-924c-4038-a675-76f743aa558d	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjc5OTgwLCJleHAiOjE3NzQ4ODQ3ODB9.S5_jb5u_BDbHhWT7Zsao8nbIUzwEOmp-gPQB9xbP_m4	2026-03-30 15:33:00.635557	2026-03-23 15:33:00.635557
540e4080-2eb5-4495-88ed-1e591088ba83	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwMDIwLCJleHAiOjE3NzQ4ODQ4MjB9._SdKJuLa3P05mfJFYxZlHrmhef6lqbg_XBNSCvv5Cn8	2026-03-30 15:33:40.356939	2026-03-23 15:33:40.356939
576266ce-c907-4714-94eb-689c8803dda4	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwMDY1LCJleHAiOjE3NzQ4ODQ4NjV9.-h9LoPdOO69xMWyn8mnQ76-pc-3ciXapsK7mwCCeUHA	2026-03-30 15:34:25.002015	2026-03-23 15:34:25.002015
cb432761-4894-47a1-9c20-018593acae14	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwMDkwLCJleHAiOjE3NzQ4ODQ4OTB9.2hact5b7G9FIrjSZyIg3f-oYCKJUdJb7ksC1F4g1-LI	2026-03-30 15:34:50.130659	2026-03-23 15:34:50.130659
7a969c7e-281f-47b2-878f-d5a1189775ee	b9110cbb-f73a-4599-81f4-4972beb70df4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MTEwY2JiLWY3M2EtNDU5OS04MWY0LTQ5NzJiZWI3MGRmNCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwMzY5LCJleHAiOjE3NzQ4ODUxNjl9.SRN-fdQkd4Y2Iz1Cm0E2gMqd_BJGnLSEwoeRkDMXYHM	2026-03-30 15:39:29.050653	2026-03-23 15:39:29.050653
11488de1-5ad5-499c-83a8-d5b576006bff	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwNDA4LCJleHAiOjE3NzQ4ODUyMDh9.DNCPRBsz1F0KHo_DAF64AJhvMzpqBmzb8ms-ugkdibM	2026-03-30 15:40:08.924663	2026-03-23 15:40:08.924663
b162a07f-d05c-48e6-99dd-45fbef52e0d1	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwNDI0LCJleHAiOjE3NzQ4ODUyMjR9.wtAfZgY6Fvxj9zowAOyThfgigQeSFQmQhqX0M8Vt4Zw	2026-03-30 15:40:24.480943	2026-03-23 15:40:24.480943
c66ea7c2-0d79-4c66-a987-331fddbe9583	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwNDU2LCJleHAiOjE3NzQ4ODUyNTZ9.Eg8fFbXQBpnKa058x49TEVUkJATSVtNupdHqCoRcL94	2026-03-30 15:40:56.495513	2026-03-23 15:40:56.495513
73c184a8-0518-4066-b309-f189e6e25105	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwNTEwLCJleHAiOjE3NzQ4ODUzMTB9.OkfyxAuw-4dSa6rBuAY2YFM5IYRVeKYY9iaTxdZWvpo	2026-03-30 15:41:50.126859	2026-03-23 15:41:50.126859
1b9e5217-8414-45cf-a6ee-989bcd13dc65	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwNTYxLCJleHAiOjE3NzQ4ODUzNjF9.-ds6SEu0lgQUgMHHV7tcHy4QUcoWoTm0DcawNPP99zo	2026-03-30 15:42:41.22023	2026-03-23 15:42:41.22023
b97ef649-027f-4e86-9581-8b7ca4e59db7	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwNTcyLCJleHAiOjE3NzQ4ODUzNzJ9.Pt9_IXCVOOqye5EuCQki7MaKl1j9uUqrQyxWCEThOhY	2026-03-30 15:42:52.530687	2026-03-23 15:42:52.530687
360f4b4b-c885-468a-bd89-d4c0d07c8c3f	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwNjAzLCJleHAiOjE3NzQ4ODU0MDN9.RlbNO2b9zXyA1V8t__WZ9hqA0VjhaDwX1Wt-3DmMhCw	2026-03-30 15:43:23.115639	2026-03-23 15:43:23.115639
062cb5c2-f354-44fc-84a0-0b296d5532e1	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwNjk2LCJleHAiOjE3NzQ4ODU0OTZ9.qQwrt-3Pt93SKKDETcDLELFG6Jo-uDl-AeIoJ6gczyw	2026-03-30 15:44:56.943476	2026-03-23 15:44:56.943476
8867eebf-d58c-40c8-b52b-31c0821a1275	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwNzA4LCJleHAiOjE3NzQ4ODU1MDh9.IytIvYXKe3atMg61I4jsjek_j5jyvNf4yuAAjj_KQ4Q	2026-03-30 15:45:08.008651	2026-03-23 15:45:08.008651
0d7c8ce1-d95f-4e40-980f-915fe70ad992	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwNzk4LCJleHAiOjE3NzQ4ODU1OTh9.T2ocCyXMp3hWHAaSYQ5DLwlxLRScbNk2xRNv8ifOHpY	2026-03-30 15:46:38.107975	2026-03-23 15:46:38.107975
3ab6b30f-090c-4de1-8ddc-e87bcd072363	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgwODA0LCJleHAiOjE3NzQ4ODU2MDR9.uOgWl74PFN-TNwrYIWraRzNNCjbB0PbgXsa2h3eYFiM	2026-03-30 15:46:44.852791	2026-03-23 15:46:44.852791
661b66ef-275e-451b-8862-5fd9718650d8	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgxMDA1LCJleHAiOjE3NzQ4ODU4MDV9.gRSJW6IHUNscuv8y6cgmAPfhC6uAHudhtBjd4TKi32U	2026-03-30 15:50:05.894217	2026-03-23 15:50:05.894217
3e328f5b-df29-48af-b28f-c708e2fa3a58	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgxNTc3LCJleHAiOjE3NzQ4ODYzNzd9.UR-jSJQDuQ9AJR2wbRs8K05VlGPGHEVqsJ77I27bJgU	2026-03-30 15:59:37.640991	2026-03-23 15:59:37.640991
b97e7834-82eb-43c9-b453-3f6272f66ea5	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgxNjY0LCJleHAiOjE3NzQ4ODY0NjR9.4KWprWa-DLdhtQGtlgERQWPmi7eVRSyGYc5YN_YbEQY	2026-03-30 16:01:04.021188	2026-03-23 16:01:04.021188
d5f8e08e-fbc4-49c8-a340-a78b18999247	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgxNzIzLCJleHAiOjE3NzQ4ODY1MjN9.F_XMvUs6IimVMaHsz0CcgEanzWzPJRx5ysx2Hl-IxJI	2026-03-30 16:02:03.117855	2026-03-23 16:02:03.117855
3d84d0c2-cd5d-4c9e-86c5-66732a47da4b	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgyMDc4LCJleHAiOjE3NzQ4ODY4Nzh9.zXvSgvchtSZ2MhScj56ZIq0UUhF-_HGdOauVWGSoZD0	2026-03-30 16:07:58.120874	2026-03-23 16:07:58.120874
ee15144d-3040-4ce6-bea7-63bf38514227	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgyMjgyLCJleHAiOjE3NzQ4ODcwODJ9.3RBzD9zLRo5lK3i2-IUo1oo4oFqEGON1vxnqy0D87fw	2026-03-30 16:11:22.613354	2026-03-23 16:11:22.613354
0c88287f-e22c-4f53-b072-1c06b0d9fd01	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgyOTMyLCJleHAiOjE3NzQ4ODc3MzJ9.MGBCL2VD8yMDECGOWALNZt8lMHNci4G3X9sSHWgfyRM	2026-03-30 16:22:12.971238	2026-03-23 16:22:12.971238
487551dd-79c9-490d-8b15-f2c0f5f4000a	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgyOTc4LCJleHAiOjE3NzQ4ODc3Nzh9.nYD4VaK-GfV86FXFkoRV8-uU2SRmB5X2rs0VtKBvoBU	2026-03-30 16:22:58.168346	2026-03-23 16:22:58.168346
79e4d491-827f-4477-bb85-adc362cf9d08	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgzOTA5LCJleHAiOjE3NzQ4ODg3MDl9.YP0awcDnumKw2_VpV16btS9zKynYrQntRicFzI-W1kk	2026-03-30 16:38:29.251171	2026-03-23 16:38:29.251171
4e05362a-25aa-45e9-8264-231ae7b1415b	b9110cbb-f73a-4599-81f4-4972beb70df4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MTEwY2JiLWY3M2EtNDU5OS04MWY0LTQ5NzJiZWI3MGRmNCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MjgzOTIwLCJleHAiOjE3NzQ4ODg3MjB9.V9LU0DWlZvO0tgxOvCYw1B7D3MCN5nZcKjFllp3vUvU	2026-03-30 16:38:40.475205	2026-03-23 16:38:40.475205
03e8d0b9-ad44-491b-b27a-c97c6ee1692a	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg0MjY5LCJleHAiOjE3NzQ4ODkwNjl9.E2GsCv62fjWCXtaactMYNnAnzmhzd7lft2hiWojIooM	2026-03-30 16:44:29.800611	2026-03-23 16:44:29.800611
c4fc9d59-4ef8-4c2d-bb6a-b30e6f6cd841	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg0MzI4LCJleHAiOjE3NzQ4ODkxMjh9.GFTPI7DCMloHbPeiuCFaZELzMHrIIu8y1HOHpvzY1_8	2026-03-30 16:45:28.048203	2026-03-23 16:45:28.048203
b6802a0e-9921-4012-a0c0-1906f96f7431	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg0MzI5LCJleHAiOjE3NzQ4ODkxMjl9.KSX-nupCGE5SucVYFEx_uv39S6QaNKy6VUoqyLLyFRc	2026-03-30 16:45:29.036517	2026-03-23 16:45:29.036517
b033c298-7de1-4821-a474-8e874cfe2a39	b9110cbb-f73a-4599-81f4-4972beb70df4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MTEwY2JiLWY3M2EtNDU5OS04MWY0LTQ5NzJiZWI3MGRmNCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg0MzY4LCJleHAiOjE3NzQ4ODkxNjh9.lFAgIAVJmtQO2Xmk9jHd0x1n2wxsDSamZYloVOM5EAE	2026-03-30 16:46:08.790392	2026-03-23 16:46:08.790392
ec30e3d5-8f4e-4902-ad03-8e11b1630754	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg0NDQ5LCJleHAiOjE3NzQ4ODkyNDl9.cUoTET8kdLh460WCthyB-MSb7MqEz5nlL2UT6UrWvmc	2026-03-30 16:47:29.343563	2026-03-23 16:47:29.343563
29283269-e9d0-4771-a13a-054b8c6c117a	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg0NTQzLCJleHAiOjE3NzQ4ODkzNDN9.6aqfsy_8jhTYBjSwXLhFkqwsyHnG3S7IeqPebnU0ZpY	2026-03-30 16:49:03.428586	2026-03-23 16:49:03.428586
28b11004-5839-4394-a2d4-eb0c0784b2b0	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg0NTkxLCJleHAiOjE3NzQ4ODkzOTF9.HFgpH49MqLdx8xEhQxT7GbfCjlAGAS2P9VpEu8CDYYU	2026-03-30 16:49:51.507854	2026-03-23 16:49:51.507854
a0be542f-a83c-4cea-9795-60147ebe9209	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg0NjE3LCJleHAiOjE3NzQ4ODk0MTd9.ktKXsJ7GE7vwwB2RY_a1hq8HXHEQqVryERGlnRpzSvc	2026-03-30 16:50:17.796343	2026-03-23 16:50:17.796343
c420f8e8-feec-474a-af6a-0fc370ba86f1	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg0NzAxLCJleHAiOjE3NzQ4ODk1MDF9.MX2FGd3bXU4jms2H8o_AJxIflHtdCB51hmUkB3nrvzw	2026-03-30 16:51:41.419199	2026-03-23 16:51:41.419199
9cec50f1-6c44-4b42-820a-b082ad42c3d5	b9110cbb-f73a-4599-81f4-4972beb70df4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MTEwY2JiLWY3M2EtNDU5OS04MWY0LTQ5NzJiZWI3MGRmNCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg0ODQwLCJleHAiOjE3NzQ4ODk2NDB9.lsjkRzTNkzWuHQdm-c15V_gaXWwHS7UXwDD0pgAJe0w	2026-03-30 16:54:00.561433	2026-03-23 16:54:00.561433
5df0a49e-335a-42c3-a8ec-f3b32901cd9d	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg1OTQxLCJleHAiOjE3NzQ4OTA3NDF9.LF8Rd7XameUK-g1e34nLYJtubXIm8QZMrcNkTD1SKD8	2026-03-30 17:12:21.808259	2026-03-23 17:12:21.808259
1fd88cd6-7bcd-4216-a8ad-27c600625cb4	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg2MDA3LCJleHAiOjE3NzQ4OTA4MDd9.eSe2cOx5OJGCIWiGF4gS7ADS0EQVp6fG1zI8kuk87dg	2026-03-30 17:13:27.842246	2026-03-23 17:13:27.842246
54fa4724-85e5-42f1-be73-10bee62c4fd3	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg2MDg3LCJleHAiOjE3NzQ4OTA4ODd9.A6l-vhj7LGuhFLiik3rYeKB1Rtjkzp8jCWvLRNsX9GE	2026-03-30 17:14:47.425603	2026-03-23 17:14:47.425603
0648c0c8-fa8d-4ea6-a809-c0fe326c6cc3	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0Mjg5OTcwLCJleHAiOjE3NzQ4OTQ3NzB9.flVjcIf2QmsnJLaN8G4W2Xe-yiyTMJ8stu8z6uJR97Q	2026-03-30 18:19:30.164887	2026-03-23 18:19:30.164887
e673543b-9dfe-4d22-a4d7-913ed7019d58	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzA4NTQ3LCJleHAiOjE3NzQ5MTMzNDd9.OobGaurQhKlrdpKEv5qLqfzwPFrUnlKuoA-hUdlSYFQ	2026-03-30 23:29:07.805931	2026-03-23 23:29:07.805931
ae11cfeb-ddc2-4bf6-bdcf-6c752cd623ef	b9110cbb-f73a-4599-81f4-4972beb70df4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MTEwY2JiLWY3M2EtNDU5OS04MWY0LTQ5NzJiZWI3MGRmNCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzA4NTY0LCJleHAiOjE3NzQ5MTMzNjR9.FXiHV0A5QMhVDhwAFnY8-F5uZ19CXkv0s--SuCxvKp8	2026-03-30 23:29:24.72534	2026-03-23 23:29:24.72534
b131cb06-baa0-4a82-b6b9-69d5e45723fd	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzI4MzU2LCJleHAiOjE3NzY5MjAzNTZ9.oaB6h1NYICxEHuACPEb1-tqslMZ0YXzSif2i_US1LU0	2026-03-31 04:59:16.126205	2026-03-24 04:59:16.126205
3c547793-b6f5-4634-9e9f-997c609fd0f6	b9110cbb-f73a-4599-81f4-4972beb70df4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MTEwY2JiLWY3M2EtNDU5OS04MWY0LTQ5NzJiZWI3MGRmNCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzI4MzcyLCJleHAiOjE3NzY5MjAzNzJ9.8dhJ-rG1CLQ93EPAYmj-ODn1H9nhiQRN8jjRXC4F6rI	2026-03-31 04:59:32.676214	2026-03-24 04:59:32.676214
2c8b4187-cf27-4b8d-86cd-07fb8e567929	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzU4MDIwLCJleHAiOjE3NzY5NTAwMjB9.3KqQjraX1xd3qqN34Kc_f_IrgOL4LPkEQ7Y6A60YxNg	2026-03-31 13:13:40.338439	2026-03-24 13:13:40.338439
020bc123-7720-4626-b52f-ad02f9153e0b	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUyMTllMzJlLThhMzgtNGE0Zi1iY2U2LTI5MGUyNGVmNGRjZiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzYxNTgxLCJleHAiOjE3NzY5NTM1ODF9.T0dVP02cmkdqmsiA4ycCYHbgjYbVjM8OUbbi-Ba1Ntk	2026-03-31 14:13:01.889231	2026-03-24 14:13:01.889231
44e11ffe-dfcf-49f3-a691-744c41038ed1	9e0b7bd8-c1da-4cbd-a625-4dfc080c2023	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjllMGI3YmQ4LWMxZGEtNGNiZC1hNjI1LTRkZmMwODBjMjAyMyIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY1OTM3LCJleHAiOjE3NzY5NTc5Mzd9.zNaLNBjumSGxB1oAj6xMdio6pyus0kyWIfvFgjE_EIs	2026-03-31 15:25:37.546208	2026-03-24 15:25:37.546208
2f0be0c6-4459-4c0e-89ea-1cc9058d8014	12b1397a-3cdb-43ad-b456-59139dbf242b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyYjEzOTdhLTNjZGItNDNhZC1iNDU2LTU5MTM5ZGJmMjQyYiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY1OTQ2LCJleHAiOjE3NzY5NTc5NDZ9.3zXdqIg2Z2YtVdCyrFRBnGD6p31QBXOWjjjNbeYxZYE	2026-03-31 15:25:46.004697	2026-03-24 15:25:46.004697
e8149b2b-a697-43c7-840c-ced874b5a4a3	3347e255-7151-4758-9d02-cea86465d406	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMzNDdlMjU1LTcxNTEtNDc1OC05ZDAyLWNlYTg2NDY1ZDQwNiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY1OTU2LCJleHAiOjE3NzY5NTc5NTZ9.dxQoBEJtG-76Nor8EZGa3UhRME-54Oc1CizG_fAN_ik	2026-03-31 15:25:56.223287	2026-03-24 15:25:56.223287
b913cc37-da77-4d11-97fe-7bc5928c6789	00e5b5fb-426e-4dd8-9841-e7644d6fd611	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwZTViNWZiLTQyNmUtNGRkOC05ODQxLWU3NjQ0ZDZmZDYxMSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY1OTY4LCJleHAiOjE3NzY5NTc5Njh9._ndJmCclF5BgLMd5dEmTZYnBfdm8KSpfxtZgpQYevdo	2026-03-31 15:26:08.537514	2026-03-24 15:26:08.537514
ed20e8bb-0834-47c8-a780-0a824df3cf4e	5cef9e9e-07bc-4452-a90c-55ce972629ad	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVjZWY5ZTllLTA3YmMtNDQ1Mi1hOTBjLTU1Y2U5NzI2MjlhZCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY1OTgyLCJleHAiOjE3NzY5NTc5ODJ9.lXqLXCxZ2We7vlVHJThAWL0ui7MMq9ObWchWPWBU6cY	2026-03-31 15:26:22.874143	2026-03-24 15:26:22.874143
d0c27aa5-7903-49cf-966c-c3d20024e3ac	67259408-e736-4f28-87b9-6150177364a6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MjU5NDA4LWU3MzYtNGYyOC04N2I5LTYxNTAxNzczNjRhNiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY1OTgyLCJleHAiOjE3NzY5NTc5ODJ9.x3u3lugJnMTRx_M7M_530vFyOn5rOpNpw5N8jd-wCiE	2026-03-31 15:26:22.946313	2026-03-24 15:26:22.946313
3d8fefe4-79d6-432a-a52c-b7cdf7a5279d	37533c62-bc6a-4000-ada7-bbc052890db0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3NTMzYzYyLWJjNmEtNDAwMC1hZGE3LWJiYzA1Mjg5MGRiMCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY1OTk3LCJleHAiOjE3NzY5NTc5OTd9.12t4WUzagQz9MpV3YE5lcWi4SuM_7By0qK0aLlQ1TWA	2026-03-31 15:26:37.41238	2026-03-24 15:26:37.41238
efa1dfba-f237-428d-87b7-d66b691bb873	6ec7b154-748b-410d-97f5-26b86bf35461	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZlYzdiMTU0LTc0OGItNDEwZC05N2Y1LTI2Yjg2YmYzNTQ2MSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY1OTk3LCJleHAiOjE3NzY5NTc5OTd9.k8NkUXGL1MOwMJFM1w5ZKYyj7ZuqBrEiyTcpqbzSBZw	2026-03-31 15:26:37.484093	2026-03-24 15:26:37.484093
0a59b3a7-2d38-48f3-b4ae-44b3f4beada5	5204dea9-3150-49d3-b5e5-73a0fd5fde21	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUyMDRkZWE5LTMxNTAtNDlkMy1iNWU1LTczYTBmZDVmZGUyMSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2MDExLCJleHAiOjE3NzY5NTgwMTF9.eecWsUYpfKAcjNiQ9MMDoTHXgtZ6iSCVKwBSdd3X-Ag	2026-03-31 15:26:51.586482	2026-03-24 15:26:51.586482
2f51619a-c09f-456e-91ef-bde53ebc3273	574ac352-0354-4496-9350-a69c9bf869ae	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjU3NGFjMzUyLTAzNTQtNDQ5Ni05MzUwLWE2OWM5YmY4NjlhZSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2MDExLCJleHAiOjE3NzY5NTgwMTF9.MhT8YI95OAx1jp7n3iWtt9GUCaxEtAiuga0IFaf-pg0	2026-03-31 15:26:51.624213	2026-03-24 15:26:51.624213
e4bf052c-ef87-4e0d-9ae7-2b00fdb89e2e	765395e6-fd89-4d9c-b56b-64060f44663e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc2NTM5NWU2LWZkODktNGQ5Yy1iNTZiLTY0MDYwZjQ0NjYzZSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2MDI2LCJleHAiOjE3NzY5NTgwMjZ9.84CAw78EcPgVNwCf_-8i1pBGrH4g9DV4gAbZeD9zwhc	2026-03-31 15:27:06.484851	2026-03-24 15:27:06.484851
fcbb546e-8d40-44c5-817a-36c414f9e33c	9696b545-ada2-4446-9a1c-a350ee404dc4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk2OTZiNTQ1LWFkYTItNDQ0Ni05YTFjLWEzNTBlZTQwNGRjNCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2MDI2LCJleHAiOjE3NzY5NTgwMjZ9.ld_GbVprHu9iLe1ioohdEvmA56zjO342j-67mLaVYoc	2026-03-31 15:27:06.522194	2026-03-24 15:27:06.522194
2cdf7447-f806-45bc-87be-c0c6eab75778	dadd4881-9de8-49f8-9689-140a1ba8306c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRhZGQ0ODgxLTlkZTgtNDlmOC05Njg5LTE0MGExYmE4MzA2YyIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2MTA2LCJleHAiOjE3NzY5NTgxMDZ9.bXbck6FlU4Jcch33pkX5xoJ5SBqVn-ag29xhZTN0XjM	2026-03-31 15:28:26.141809	2026-03-24 15:28:26.141809
45ddbe35-8fba-4bdc-80e5-199c98657763	e5fe68ab-1bd2-486a-b01b-b89ab4edb087	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU1ZmU2OGFiLTFiZDItNDg2YS1iMDFiLWI4OWFiNGVkYjA4NyIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2MTA2LCJleHAiOjE3NzY5NTgxMDZ9.f37M_ktk2yMSb4Fmu2P8N9euo263WzJ8zhyGIFiqNqc	2026-03-31 15:28:26.196088	2026-03-24 15:28:26.196088
37a5a420-c99b-4705-8ba0-0b873b0885a6	6d115968-70c6-490e-a6ee-458c5a0de160	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZkMTE1OTY4LTcwYzYtNDkwZS1hNmVlLTQ1OGM1YTBkZTE2MCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2MTM3LCJleHAiOjE3NzY5NTgxMzd9.rr4qOqyeXXJcpnvI8ETlCxa02ufSj19LftXOUDq48PE	2026-03-31 15:28:57.698374	2026-03-24 15:28:57.698374
47f1422d-cb68-4002-8fc2-1836b19e223e	9f579014-d9f5-4443-bcc7-7477a6331c7c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmNTc5MDE0LWQ5ZjUtNDQ0My1iY2M3LTc0NzdhNjMzMWM3YyIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2MjMwLCJleHAiOjE3NzY5NTgyMzB9.x72akowuSaxFnrP--zY_5XfXYNzRBYXjBTxFnCrRLIw	2026-03-31 15:30:30.013738	2026-03-24 15:30:30.013738
d389e2c6-abc6-4e28-96ef-9edfd73f8205	8aa18a48-8e44-4bb9-b7b2-46e52706bddc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhhYTE4YTQ4LThlNDQtNGJiOS1iN2IyLTQ2ZTUyNzA2YmRkYyIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2MjMwLCJleHAiOjE3NzY5NTgyMzB9.lpSQh8DOPppTHNkL6igLASVQHaSerSDjD3pP2EVTk7A	2026-03-31 15:30:30.053279	2026-03-24 15:30:30.053279
534977e7-f8b3-43e5-bf76-45340480df3b	2f02c8b1-af64-4483-9f0d-c19ac0663de1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJmMDJjOGIxLWFmNjQtNDQ4My05ZjBkLWMxOWFjMDY2M2RlMSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2MzAwLCJleHAiOjE3NzY5NTgzMDB9.kD37yDRivn-XMK7i_acsjZrZNUgegVnPKgrAVohoyyU	2026-03-31 15:31:40.627559	2026-03-24 15:31:40.627559
52d8c981-fd1a-497e-8b6b-3984d450d629	36007f5c-d6c7-4759-bb22-fa4266c10b10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM2MDA3ZjVjLWQ2YzctNDc1OS1iYjIyLWZhNDI2NmMxMGIxMCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2MzAwLCJleHAiOjE3NzY5NTgzMDB9.HJ-2ZyExvkhGkliJqswB-U_8wQLQD0Wv0hBHGIR7i_I	2026-03-31 15:31:40.679481	2026-03-24 15:31:40.679481
94362866-0754-4e6f-a08a-dc0395b21da1	e381f929-c11c-4fe3-acd4-1925f36581be	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImUzODFmOTI5LWMxMWMtNGZlMy1hY2Q0LTE5MjVmMzY1ODFiZSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2NDMzLCJleHAiOjE3NzY5NTg0MzN9.besS_R2tDp4Q3rqddrLGtQXuP0MI3ZNSBqm7Rwifczk	2026-03-31 15:33:53.04978	2026-03-24 15:33:53.04978
5a204fd2-0f04-43f6-87f8-8ceb3ccf8d6a	2d93810d-7314-4c35-9458-19580a18e961	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjJkOTM4MTBkLTczMTQtNGMzNS05NDU4LTE5NTgwYTE4ZTk2MSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2NDQ5LCJleHAiOjE3NzY5NTg0NDl9.Ker4U13xSbfJYkYCJBUu1hrbJ_yG5Ge1kr4kCwzg2Zs	2026-03-31 15:34:09.164294	2026-03-24 15:34:09.164294
c60395bb-0d78-4ede-932f-29921fe1d1e3	6ad599b8-1a95-42f8-a2b9-576033d89f55	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhZDU5OWI4LTFhOTUtNDJmOC1hMmI5LTU3NjAzM2Q4OWY1NSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2NTI2LCJleHAiOjE3NzY5NTg1MjZ9.GqLE7kNRMRQamfl9WEB7nVDhlz9YFniR55Mi5jrTk-I	2026-03-31 15:35:26.733786	2026-03-24 15:35:26.733786
48b2c16c-3004-4bd7-8fba-ecba535ccf49	c289fe12-2c72-4587-9f66-a92d02b8658b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImMyODlmZTEyLTJjNzItNDU4Ny05ZjY2LWE5MmQwMmI4NjU4YiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2NTk3LCJleHAiOjE3NzY5NTg1OTd9.LLWBy300OhTZGP67FenS4PgSa5Sv0HPTo0t815b8qR0	2026-03-31 15:36:37.412155	2026-03-24 15:36:37.412155
503929b3-f533-4a84-bf18-14c332ea9361	afcbdc83-ffde-4690-bd9c-cc6e93c67a91	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFmY2JkYzgzLWZmZGUtNDY5MC1iZDljLWNjNmU5M2M2N2E5MSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2NjQyLCJleHAiOjE3NzY5NTg2NDJ9.8URbFfvtPfvdtG5aOkh-jnTjclF2TdXLvrUVMuG9718	2026-03-31 15:37:22.235214	2026-03-24 15:37:22.235214
e1c44d3a-7ae3-4ad4-9772-0fce45998b3c	b9110cbb-f73a-4599-81f4-4972beb70df4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI5MTEwY2JiLWY3M2EtNDU5OS04MWY0LTQ5NzJiZWI3MGRmNCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY2ODQwLCJleHAiOjE3NzY5NTg4NDB9.h3JdY85f46aMJkXsUC7EU024u-FAf2w2JY3ggfGik7o	2026-03-31 15:40:40.950786	2026-03-24 15:40:40.950786
73dfcef2-0837-4c6b-9ae4-97905079c002	a168e9f9-0180-42d2-9ddf-b92a8c337edb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImExNjhlOWY5LTAxODAtNDJkMi05ZGRmLWI5MmE4YzMzN2VkYiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY3MDQ5LCJleHAiOjE3NzY5NTkwNDl9.x9s2IWrd2oIrRZxHSIKwmsLK232WhFC7cfR2VQrFYGE	2026-03-31 15:44:09.09469	2026-03-24 15:44:09.09469
60cbd8dd-ca23-4516-ad6a-adc3bf9e6b01	cc95a077-4c02-49b5-a5f3-bc815c7ee567	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNjOTVhMDc3LTRjMDItNDliNS1hNWYzLWJjODE1YzdlZTU2NyIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY3MDQ5LCJleHAiOjE3NzY5NTkwNDl9.XDXhFyHf73H235cO1vW91h1oFaOQYG1I2jpQyENfi_A	2026-03-31 15:44:09.150761	2026-03-24 15:44:09.150761
54ecf459-6987-4bfc-807b-11eebdde0ef4	5231d6d0-b641-4873-bbd5-dee25b338be6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUyMzFkNmQwLWI2NDEtNDg3My1iYmQ1LWRlZTI1YjMzOGJlNiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY3MTM0LCJleHAiOjE3NzY5NTkxMzR9.d7q5yOwUQ2ukDycoOVwWd92GHqf45QOPixvMDBwZjUk	2026-03-31 15:45:34.347566	2026-03-24 15:45:34.347566
16f00b9c-9c4f-488b-9bc7-ac1734d3bf6d	45305cb6-3fb8-4ed0-bece-6cc69f137855	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQ1MzA1Y2I2LTNmYjgtNGVkMC1iZWNlLTZjYzY5ZjEzNzg1NSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY3MTM0LCJleHAiOjE3NzY5NTkxMzR9.V2pAxMrj0jz3oJ2udlaACYI6Bc3RdIwwDwKjOKoKx5I	2026-03-31 15:45:34.401719	2026-03-24 15:45:34.401719
343d4470-1048-430b-a02a-fec30d07c3dd	271fdcc5-2734-488c-800e-a6396a2e469b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI3MWZkY2M1LTI3MzQtNDg4Yy04MDBlLWE2Mzk2YTJlNDY5YiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY3MjQ1LCJleHAiOjE3NzY5NTkyNDV9.b8uA8hoB5fsdTx_TbfiAiMjFzA1iBkopifc4mvIeMPk	2026-03-31 15:47:25.045984	2026-03-24 15:47:25.045984
f3e6525a-dc11-47b2-9f7d-8e5aeb1459b0	670433ec-5dde-49d8-a8dc-459171e1c4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MDQzM2VjLTVkZGUtNDlkOC1hOGRjLTQ1OTE3MWUxYzRiNSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY3MjQ1LCJleHAiOjE3NzY5NTkyNDV9.7dnuLAyEGp36YzrAC0-E2Sls-9K6EUVWz5dDH8Bt2VQ	2026-03-31 15:47:25.103688	2026-03-24 15:47:25.103688
933eb9b0-d95c-4570-b5b9-2d4b8715d7dc	ce75ac0a-f5a4-48e2-bb94-1dda95b566e7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNlNzVhYzBhLWY1YTQtNDhlMi1iYjk0LTFkZGE5NWI1NjZlNyIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY3MzgyLCJleHAiOjE3NzY5NTkzODJ9.m8pkdpGtHI17f_nIDUuvLW6MgCOMUPC6svLBHU97Rpc	2026-03-31 15:49:42.244266	2026-03-24 15:49:42.244266
aeb15b6d-8ae1-46d9-9ebf-637ea75f0ca8	4ad2bbb3-5715-4a8f-bc03-847b3334c3de	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjRhZDJiYmIzLTU3MTUtNGE4Zi1iYzAzLTg0N2IzMzM0YzNkZSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY3MzgyLCJleHAiOjE3NzY5NTkzODJ9.FFVm6SIiCBRiBn2acm7NtcamEbxeYvmDX7ZkNuWpSDk	2026-03-31 15:49:42.305231	2026-03-24 15:49:42.305231
04102928-6412-440f-ac0b-8d934f3cad4b	52b898d1-5e40-4914-9c6b-fde221cb9186	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUyYjg5OGQxLTVlNDAtNDkxNC05YzZiLWZkZTIyMWNiOTE4NiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY4NzUyLCJleHAiOjE3NzY5NjA3NTJ9.TOUfJ7wrpo7AMgk7EMWYkWQIxufHTPr84-V4PKM1kd8	2026-03-31 16:12:32.40417	2026-03-24 16:12:32.40417
57e2ddb9-ea7a-44f3-be70-52f264a32254	b4f23e07-d44a-4b13-8ade-77832b3d5cf6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImI0ZjIzZTA3LWQ0NGEtNGIxMy04YWRlLTc3ODMyYjNkNWNmNiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY4Nzc2LCJleHAiOjE3NzY5NjA3NzZ9.EP9EV0ZgYAg7Fya9mz-W3YCAhhbc-xDvuS4z7RmKI5A	2026-03-31 16:12:56.305379	2026-03-24 16:12:56.305379
4d88bfb7-ae86-428c-bacb-300b8758246e	7fdb62ac-745a-4033-95bc-21bc69f693be	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjdmZGI2MmFjLTc0NWEtNDAzMy05NWJjLTIxYmM2OWY2OTNiZSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY4Nzc2LCJleHAiOjE3NzY5NjA3NzZ9.0BgpB9uf6pPIEir4zybABbvmOLwxMsen-1MmhEMjB8U	2026-03-31 16:12:56.364623	2026-03-24 16:12:56.364623
e65269c3-99f3-4de9-9026-b98212bfd2f8	f2df023e-7644-48c1-a948-7d987c41f1b6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImYyZGYwMjNlLTc2NDQtNDhjMS1hOTQ4LTdkOTg3YzQxZjFiNiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY5NDQwLCJleHAiOjE3NzY5NjE0NDB9.QpkVuJ11KGWOhLdSNZXwtQoyrKQGJOdt-P8A3UVfjkU	2026-03-31 16:24:00.253478	2026-03-24 16:24:00.253478
a1996a83-8f59-4e81-83de-8fe701b25f11	a1a75f59-ef6b-4c38-bc41-beebf7365df2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImExYTc1ZjU5LWVmNmItNGMzOC1iYzQxLWJlZWJmNzM2NWRmMiIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc0MzY5NDQwLCJleHAiOjE3NzY5NjE0NDB9.b86RG1_zMl5QsPaQCvMN0XzXyrdcYdnkD-HV6OQveLQ	2026-03-31 16:24:00.360884	2026-03-24 16:24:00.360884
\.


--
-- Data for Name: rewards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rewards (id, family_id, title, icon, star_cost, rarity, is_active, sort_order, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: spin_wheel_prizes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spin_wheel_prizes (id, name, prize_type, prize_value, sticker_id, weight, is_active, created_at, emoji) FROM stdin;
0f79e241-a619-4f35-b295-6dee68540c42	1星	stars	1	\N	40	t	2026-03-23 15:34:20.018019	🎁
34fc4108-3639-46e4-abd4-6c2184d2918a	2星	stars	2	\N	25	t	2026-03-23 15:34:20.018019	🎁
58efbac2-971c-45f9-a072-f94a9be65bd4	3星	stars	3	\N	15	t	2026-03-23 15:34:20.018019	🎁
8aea710d-469a-43db-92dc-9d43595ee6ec	5星	stars	5	\N	8	t	2026-03-23 15:34:20.018019	🎁
3240701c-0543-4a40-8e6e-5592f5a96058	再来一次	none	0	\N	7	t	2026-03-23 15:34:20.018019	🎁
4489d49c-b6f9-41dd-a42c-16c9618400b3	谢谢参与	none	0	\N	5	t	2026-03-23 15:34:20.018019	🎁
\.


--
-- Data for Name: stickers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stickers (id, name, emoji, rarity, description, created_at) FROM stdin;
35a7f87b-1a9e-41a9-8b4e-82b6985b47a7	小星星	⭐	N	完成任务的普通奖励	2026-03-23 15:30:26.27254
6ccbaddb-5ec6-4b06-a8c0-d6ccc46ff439	小红花	🌸	N	表现不错哦	2026-03-23 15:30:26.27254
208971e0-48ca-4ed6-bf5b-b96a20f48a9c	小太阳	☀️	N	温暖的一天	2026-03-23 15:30:26.27254
c89d2af5-07c5-46d1-a46d-bdc0489e05e6	小月亮	🌙	N	安静的夜晚	2026-03-23 15:30:26.27254
20a1e275-dceb-46b0-85a8-3701c4fb363b	小云朵	☁️	N	轻松一下	2026-03-23 15:30:26.27254
de2fbf38-b3bf-4aea-a60d-75a32046aac2	小水滴	💧	N	保持水分	2026-03-23 15:30:26.27254
03fdef1d-7c06-44f2-8b34-21001246ef52	小火焰	🔥	N	小小的热情	2026-03-23 15:30:26.27254
4dce2fb2-af00-42da-90a6-cfa2653da1e2	小树叶	🍃	N	大自然的气息	2026-03-23 15:30:26.27254
58553b79-44c0-4b51-b828-3296bb2fdccc	小彩虹	🌈	N	美丽的色彩	2026-03-23 15:30:26.27254
65c8bbf4-68f7-430a-befe-297885a42789	小雪人	⛄	N	冬日可爱	2026-03-23 15:30:26.27254
d6e49ca3-32ba-4a36-8c73-12632e2717d8	小草莓	🍓	N	甜甜的味道	2026-03-23 15:30:26.27254
db90327c-4b3b-4881-8e53-8fc721552649	小西瓜	🍉	N	夏日清凉	2026-03-23 15:30:26.27254
ede2a318-08d6-4046-9e1a-1c35c9b5daed	小苹果	🍎	N	健康之果	2026-03-23 15:30:26.27254
a92de7f7-f0e0-4cf0-b319-2f39f9491e86	小蛋糕	🍰	N	甜蜜时光	2026-03-23 15:30:26.27254
a2bade44-6b07-4ef0-a4c1-1344e47e946a	小糖果	🍬	N	小小的甜	2026-03-23 15:30:26.27254
f5579fc2-3559-409f-83f0-91baab4f187f	小饼干	🍪	N	酥脆可口	2026-03-23 15:30:26.27254
c55052da-c059-496b-a567-952760195883	小冰淇淋	🍦	N	凉爽一下	2026-03-23 15:30:26.27254
2b9197ed-e884-4c0c-ac55-a27d6fc16e14	小咖啡	☕	N	提提神	2026-03-23 15:30:26.27254
7321ec07-f602-47dc-b352-53ca809cbfb7	小书本	📖	N	学习使我快乐	2026-03-23 15:30:26.27254
68a4ceb0-8f11-467f-8ec9-8d275f12d9e8	小铅笔	✏️	N	认真作业	2026-03-23 15:30:26.27254
05f87ea1-9519-4275-8cf9-ab52feffef77	金色星星	🌟	R	闪闪发光	2026-03-23 15:30:26.27254
f14e2d83-960b-463b-a2d7-d0f8c265e4b0	粉色花朵	🌺	R	美丽的花	2026-03-23 15:30:26.27254
0bb19372-fe00-488a-acdb-b9364c069f81	蓝色蝴蝶	🦋	R	翩翩起舞	2026-03-23 15:30:26.27254
72b9378d-4ba0-49dd-af3b-3be2cb148e4d	紫色蜗牛	🐌	R	慢慢爬行	2026-03-23 15:30:26.27254
06975ce0-0e0b-4f76-9db0-14a44a56329b	橙色狐狸	🦊	R	聪明伶俐	2026-03-23 15:30:26.27254
d29f3d4f-2351-4745-a514-14af70c4675d	绿色青蛙	🐸	R	跳跃高手	2026-03-23 15:30:26.27254
4c3798ea-b444-4308-a7f9-6d99c9723585	棕色小熊	🐻	R	憨态可掬	2026-03-23 15:30:26.27254
8a3fa71c-7535-45ac-b908-e82f470a41c4	白色兔子	🐰	R	蹦蹦跳跳	2026-03-23 15:30:26.27254
c81a17cd-bef7-467c-b2b1-89e1a7396875	灰色小猫	🐱	R	乖巧可爱	2026-03-23 15:30:26.27254
19d4842c-e0b3-4e53-aec0-c047046a75d5	蓝色海豚	🐬	R	聪明友好	2026-03-23 15:30:26.27254
7e320ad4-b9f6-48cc-bae2-95e7862d29ec	黄色小鸡	🐥	R	活泼可爱	2026-03-23 15:30:26.27254
eba1cdf2-2ba3-4a5a-b294-f3594534ab88	黑白奶牛	🐄	R	哞哞叫	2026-03-23 15:30:26.27254
4f978a71-84ff-4964-8518-337992b14070	紫色独角兽	🦄	R	梦幻般的	2026-03-23 15:30:26.27254
3df1a5c9-b766-432f-890f-2519a56f404a	绿色恐龙	🦕	R	远古来客	2026-03-23 15:30:26.27254
d557b34e-acb6-4f10-b963-b17e0056a60d	红色龙	🐉	R	神秘威武	2026-03-23 15:30:26.27254
a8352aff-2fd9-4ec8-9f73-e66fc2744c52	钻石	💎	SR	珍贵稀有	2026-03-23 15:30:26.27254
a691aadf-182f-423f-9abb-1e7e72755e87	皇冠	👑	SR	至高荣誉	2026-03-23 15:30:26.27254
c878eb7d-2dc7-48f0-b1f8-ee987e3f2e27	彩虹翅膀	🪽	SR	天使之翼	2026-03-23 15:30:26.27254
d938d452-216e-456c-8488-43698ec91975	魔法棒	🪄	SR	可以实现愿望	2026-03-23 15:30:26.27254
99dc03dd-604b-4500-bbce-33ba7ff838d8	水晶球	🔮	SR	预示未来	2026-03-23 15:30:26.27254
81b90ddd-5093-44bf-aa72-73dbe3b72634	金色奖杯	🏆	SR	冠军之选	2026-03-23 15:30:26.27254
d54db7e5-1a3f-4870-a794-76be58dccdf9	彩虹独角兽	🦄	SR	传说生物	2026-03-23 15:30:26.27254
cf87a8ee-56d9-4959-9077-51ba7f3c117e	金色凤凰	🦅	SR	涅槃重生	2026-03-23 15:30:26.27254
01948d6e-7898-436a-8b3f-863526aeada1	银色月亮	🌕	SR	皎洁月光	2026-03-23 15:30:26.27254
1353e746-4165-4451-bc4d-eccf69a3fbf9	金色太阳	🌞	SR	灿烂辉煌	2026-03-23 15:30:26.27254
c3da455a-99d6-4f8c-b31e-98f435fee441	宇宙之心	💫	SSR	掌控宇宙的力量	2026-03-23 15:30:26.27254
442d024e-af7a-42d2-83f4-85a0e70ad23e	永恒之星	✨	SSR	永恒不灭的光	2026-03-23 15:30:26.27254
6f8a5ae1-c0cf-4096-a4dd-b046f40aa5b7	神圣天使	👼	SSR	最高守护	2026-03-23 15:30:26.27254
b6f14e61-67e1-4397-91d4-3606ad77a20a	传奇神龙	🐲	SSR	传说中的存在	2026-03-23 15:30:26.27254
0485ba7f-688e-4f2a-983d-f69b3a11d0b8	宇宙之主	🌌	SSR	至高无上的存在	2026-03-23 15:30:26.27254
2bef0ff7-6f0e-4ae9-b6ce-041df2b59b6f	安娜公主	👸	R	冰雪奇缘 Anna — 勇敢热情的公主	2026-03-24 15:35:45.098153
\.


--
-- Data for Name: task_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_logs (id, user_id, task_id, action, stars_earned, completed_date, created_at, approval_status, task_type) FROM stdin;
aa08c8f6-f2cd-4800-8f6a-888ac8e8dfc9	b9110cbb-f73a-4599-81f4-4972beb70df4	0962ca19-f032-4ab0-a9f8-0512737a283a	complete	1	2026-03-24	2026-03-24 14:12:27.087308	approved	normal
1af1ba07-c565-49fd-831f-cc3d2a0ab79c	b9110cbb-f73a-4599-81f4-4972beb70df4	ffb67dcb-e16d-48c3-872c-cfb51c1b21aa	complete	1	2026-03-24	2026-03-24 14:12:18.714727	approved	normal
a91f9134-d517-4ed3-9d24-bf973e57bc8d	b9110cbb-f73a-4599-81f4-4972beb70df4	11be1b0c-e520-4134-a88a-34ed32f3430b	complete	1	2026-03-24	2026-03-24 14:12:23.2569	approved	normal
cf44359f-7bc2-4acc-9207-9131144780c1	b9110cbb-f73a-4599-81f4-4972beb70df4	85f2d263-ed40-4980-adf2-bfc7100d5471	complete	1	2026-03-24	2026-03-24 14:12:15.553544	approved	normal
d7420506-0c58-4322-a0e5-40a31ff6e221	b9110cbb-f73a-4599-81f4-4972beb70df4	5fce82ee-135d-4c57-b106-ca29e790be0d	complete	1	2026-03-24	2026-03-24 14:12:06.86913	approved	normal
fca25ed9-0f66-4a99-bb6d-7ac446776616	b9110cbb-f73a-4599-81f4-4972beb70df4	16cd5732-d75e-4c9c-9fdb-7961eb92b0dd	complete	1	2026-03-24	2026-03-24 14:12:04.404739	approved	normal
537d94b0-8195-4d6d-b722-cf779c958796	b9110cbb-f73a-4599-81f4-4972beb70df4	449b8f3e-a8f7-40df-80c0-9cc724edc67f	complete	1	2026-03-24	2026-03-24 14:11:59.522631	approved	normal
56c20e86-022f-4386-af5c-acfef68d3fcd	b9110cbb-f73a-4599-81f4-4972beb70df4	5e085e88-1ffe-4252-a92b-b2f3f572f72b	complete	1	2026-03-24	2026-03-24 14:11:55.832031	approved	normal
88f7dfbd-eb57-470a-a50d-454a90f99940	b9110cbb-f73a-4599-81f4-4972beb70df4	59fc2318-1990-417d-94b0-f32107990750	complete	1	2026-03-24	2026-03-24 14:11:52.204346	approved	normal
f59d0436-670e-4eb3-a723-7f0f5940dfaf	b9110cbb-f73a-4599-81f4-4972beb70df4	05bc0096-89c5-4772-a5fe-36b09e570ef2	complete	1	2026-03-24	2026-03-24 14:11:42.339963	approved	normal
29a6e87b-3200-44a1-bc00-accc30f613f7	b9110cbb-f73a-4599-81f4-4972beb70df4	9dac253a-37fc-4a04-93ab-8119ea1efdb8	complete	1	2026-03-23	2026-03-23 17:15:34.899123	approved	normal
0842fbc9-566e-4653-bcce-1ae888dc61f4	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	9dac253a-37fc-4a04-93ab-8119ea1efdb8	complete	1	2026-03-23	2026-03-23 17:14:47.448073	approved	normal
f0515fd3-509c-4050-8bc6-a833b7b9dc0e	67259408-e736-4f28-87b9-6150177364a6	ff1b584d-7e6b-447a-ab3c-c33ab975712a	complete	2	2026-03-24	2026-03-24 15:26:22.962356	pending	normal
366ce923-0be8-4556-9c69-bef52a78a4a7	6ec7b154-748b-410d-97f5-26b86bf35461	e6409baf-4c85-4b45-8285-653797a74b10	complete	2	2026-03-24	2026-03-24 15:26:37.498934	approved	normal
b8dc6ccb-a90d-4319-9803-9fa317de5e06	cc95a077-4c02-49b5-a5f3-bc815c7ee567	600cfb8a-7ee3-4847-81db-3b37f7d954a6	complete	2	2026-03-24	2026-03-24 15:44:09.170286	approved	normal
015bb3d6-1cc6-45eb-9f19-86327eeae31c	45305cb6-3fb8-4ed0-bece-6cc69f137855	8805a0ac-15fb-40d9-aa17-1da4f44a35c8	complete	2	2026-03-24	2026-03-24 15:45:34.414736	approved	normal
872a39b0-a708-40ad-88d3-22912cff1412	670433ec-5dde-49d8-a8dc-459171e1c4b5	086d2223-3b00-44de-b80c-215167f12847	complete	1	2026-03-24	2026-03-24 15:47:25.11986	approved	normal
6603ab0d-3d45-49d4-b562-e35d1af7b7e5	4ad2bbb3-5715-4a8f-bc03-847b3334c3de	b0abc62e-1be9-4816-b09a-3dc34c9c5b0c	complete	1	2026-03-24	2026-03-24 15:49:42.321161	approved	normal
49a1bb8a-e0a8-4de8-b2ce-8f33dd53a244	7fdb62ac-745a-4033-95bc-21bc69f693be	bc7a81b0-2b46-4d48-8a7f-227badc74d31	complete	3	2026-03-24	2026-03-24 16:12:56.37972	approved	normal
2436c0ee-da7c-4f85-a76a-d8370cf42492	a1a75f59-ef6b-4c38-bc41-beebf7365df2	df0f76f2-e41f-4b31-abf6-244fbace628e	complete	5	2026-03-24	2026-03-24 16:24:00.375421	approved	normal
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, family_id, goal_id, title, icon, star_reward, rarity, frequency, frequency_count, is_active, sort_order, last_reset_date, created_at, updated_at) FROM stdin;
449b8f3e-a8f7-40df-80c0-9cc724edc67f	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	勇敢自信	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:22:13.057912	2026-03-23 16:22:13.057912
16cd5732-d75e-4c9c-9fdb-7961eb92b0dd	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	不乱发脾气	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:22:13.06771	2026-03-23 16:22:13.06771
e55d4966-ef6b-45b1-83db-5d4225d70cfc	c0479a0d-d90d-41ef-8bd4-b2b63185f501	\N	按时起床	todo-o	2	N	daily	1	t	0	\N	2026-03-24 15:26:08.589837	2026-03-24 15:26:08.589837
ff1b584d-7e6b-447a-ab3c-c33ab975712a	74455ffb-bf69-4349-8652-77eee218bbb1	\N	按时起床	todo-o	2	N	daily	1	t	0	\N	2026-03-24 15:26:22.925689	2026-03-24 15:26:22.925689
5e085e88-1ffe-4252-a92b-b2f3f572f72b	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	按时起床	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:22:13.026165	2026-03-23 16:22:13.026165
e6409baf-4c85-4b45-8285-653797a74b10	1ff79cd4-8fc9-4fd9-999f-9363a9bb142d	\N	按时起床	todo-o	2	N	daily	1	t	0	\N	2026-03-24 15:26:37.464209	2026-03-24 15:26:37.464209
600cfb8a-7ee3-4847-81db-3b37f7d954a6	c3b2a2f5-0b71-419e-b1d3-9a0052cf18bd	\N	测试任务	todo-o	2	N	daily	1	t	0	\N	2026-03-24 15:44:09.130283	2026-03-24 15:44:09.130283
8805a0ac-15fb-40d9-aa17-1da4f44a35c8	d499ef0f-0e42-46fa-90f1-f0ec9f90245a	\N	贴纸测试任务	todo-o	2	N	daily	1	t	0	\N	2026-03-24 15:45:34.382691	2026-03-24 15:45:34.382691
086d2223-3b00-44de-b80c-215167f12847	f4eadecc-0d2c-464e-a655-bb0087543c04	\N	快速任务	todo-o	1	N	daily	1	t	0	\N	2026-03-24 15:47:25.085073	2026-03-24 15:47:25.085073
b0abc62e-1be9-4816-b09a-3dc34c9c5b0c	7dff0698-4379-4e1c-aea4-7c879758d9df	\N	贴纸任务	todo-o	1	N	daily	1	t	0	\N	2026-03-24 15:49:42.283006	2026-03-24 15:49:42.283006
bc7a81b0-2b46-4d48-8a7f-227badc74d31	5d58bd89-6820-48a4-9db8-1bc7c2dd3ae4	\N	测试任务	todo-o	3	N	daily	1	t	0	\N	2026-03-24 16:12:56.342119	2026-03-24 16:12:56.342119
df0f76f2-e41f-4b31-abf6-244fbace628e	5264a0dc-9320-4403-913f-e78941abc86b	\N	测试任务	todo-o	5	N	daily	1	t	0	\N	2026-03-24 16:24:00.340349	2026-03-24 16:24:00.340349
0962ca19-f032-4ab0-a9f8-0512737a283a	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	按时睡觉	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:22:13.172159	2026-03-23 16:22:13.172159
11be1b0c-e520-4134-a88a-34ed32f3430b	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	整理书桌	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:22:13.162492	2026-03-23 16:22:13.162492
ffb67dcb-e16d-48c3-872c-cfb51c1b21aa	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	讲究卫生	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:22:13.145407	2026-03-23 16:22:13.145407
85f2d263-ed40-4980-adf2-bfc7100d5471	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	多运动	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:22:13.132453	2026-03-23 16:22:13.132453
cc7b582a-9a63-464f-bdac-82b4634af05b	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	练习舞蹈	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:22:13.122808	2026-03-23 16:22:13.122808
256dd503-557b-43ba-ac1d-474a28cfbf62	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	自己吃饭	todo-o	1	N	daily	1	f	0	\N	2026-03-23 16:22:13.11117	2026-03-23 16:22:13.11117
a9f058e9-8b21-49b2-8b6a-27e31a1736ea	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	校内英语	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:22:13.10128	2026-03-23 16:22:13.10128
5fce82ee-135d-4c57-b106-ca29e790be0d	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	坐姿端正	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:22:13.088838	2026-03-23 16:22:13.088838
7e2fe1cd-8c63-4ca3-86e3-68fa224ff906	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	完成作业	todo-o	1	N	daily	1	f	0	\N	2026-03-23 16:22:13.077717	2026-03-23 16:22:13.077717
59fc2318-1990-417d-94b0-f32107990750	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	校内语文	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:22:13.047892	2026-03-23 16:22:13.047892
b8a96365-6e53-497e-b6fa-2eeb4d3a5add	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	校内数学	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:22:13.037885	2026-03-23 16:22:13.037885
c79a2626-1d6a-4732-9de1-bfe55d12e71f	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	家庭语文	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:33:44.784127	2026-03-23 16:33:44.784127
98b46524-17fb-4324-8ec3-ee117606f256	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	家庭数学	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:33:54.090256	2026-03-23 16:33:54.090256
05bc0096-89c5-4772-a5fe-36b09e570ef2	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	家庭英语	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:34:03.774533	2026-03-23 16:34:03.774533
9dac253a-37fc-4a04-93ab-8119ea1efdb8	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	练字	todo-o	1	N	daily	1	t	0	\N	2026-03-23 16:34:31.221446	2026-03-23 16:34:31.221446
ee7382ed-c9cb-4345-91fe-d8d86d44a754	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	测试	todo-o	2	N	once	1	f	0	\N	2026-03-23 16:31:42.237453	2026-03-23 16:31:42.237453
\.


--
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_achievements (id, user_id, achievement_id, progress, unlocked_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_daily_spins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_daily_spins (id, user_id, spin_date, spins_used, created_at, prize_id, prize_name) FROM stdin;
ef54b6a5-9cbe-4cb7-aab6-d6482493d5a6	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	2026-03-23	0	2026-03-23 15:43:23.130915	0f79e241-a619-4f35-b295-6dee68540c42	1星
e2f0d276-5576-4333-82e7-dabf53a8df8a	b9110cbb-f73a-4599-81f4-4972beb70df4	2026-03-23	0	2026-03-23 15:43:34.180544	0f79e241-a619-4f35-b295-6dee68540c42	1星
9a792661-2e4c-4bca-83eb-c25e73d0434c	b9110cbb-f73a-4599-81f4-4972beb70df4	2026-03-24	0	2026-03-24 05:00:13.914802	58efbac2-971c-45f9-a072-f94a9be65bd4	3星
\.


--
-- Data for Name: user_display_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_display_settings (id, user_id, equipped_stickers, equipped_achievements, theme_color, created_at, updated_at, equipped_achievement_id, equipped_sticker_id, equipped_sticker1_id, equipped_sticker2_id, pet, theme, avatar_id) FROM stdin;
8a1d8547-19c2-445e-9907-f25a3e2ae702	b9110cbb-f73a-4599-81f4-4972beb70df4	{}	{}	pink	2026-03-23 17:00:59.414856	2026-03-24 15:48:27.325619	\N	\N	\N	\N	anna.jpg	pink	\N
\.


--
-- Data for Name: user_pets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_pets (id, user_id, pet_type, pet_mood, pet_level, last_interaction, created_at, updated_at, hunger, cleanliness, mood) FROM stdin;
e9103f08-8eba-4280-aa6a-fe23cbf969c7	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	rabbit	neutral	1	\N	2026-03-23 15:34:20.023863	2026-03-23 15:34:20.023863	100	100	100
\.


--
-- Data for Name: user_point_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_point_summary (user_id, total_earned, total_used, created_at, updated_at) FROM stdin;
b9110cbb-f73a-4599-81f4-4972beb70df4	17	0	2026-03-23 16:36:31.730844	2026-03-24 14:13:10.796348
e219e32e-8a38-4a4f-bce6-290e24ef4dcf	2	0	2026-03-23 15:34:20.021081	2026-03-24 14:13:11.254017
6ec7b154-748b-410d-97f5-26b86bf35461	2	0	2026-03-24 15:26:37.536944	2026-03-24 15:26:37.536944
cc95a077-4c02-49b5-a5f3-bc815c7ee567	2	0	2026-03-24 15:44:09.208935	2026-03-24 15:44:09.208935
45305cb6-3fb8-4ed0-bece-6cc69f137855	2	0	2026-03-24 15:45:34.449784	2026-03-24 15:45:34.449784
670433ec-5dde-49d8-a8dc-459171e1c4b5	1	0	2026-03-24 15:47:25.164694	2026-03-24 15:47:25.164694
4ad2bbb3-5715-4a8f-bc03-847b3334c3de	1	0	2026-03-24 15:49:42.357072	2026-03-24 15:49:42.357072
\.


--
-- Data for Name: user_signins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_signins (id, user_id, sign_date, stars_earned, created_at, current_streak, longest_streak, bonus_stars, streak_days) FROM stdin;
e5e3be8e-fa0d-43a8-b551-d0373318c86a	b9110cbb-f73a-4599-81f4-4972beb70df4	2026-03-23	1	2026-03-23 15:42:28.537685	0	0	1	1
bffe50c3-0c07-4c33-9f7d-b8f965ad84d6	b9110cbb-f73a-4599-81f4-4972beb70df4	2026-03-24	1	2026-03-24 10:43:23.287359	0	0	1	1
970533d7-65fb-463e-8374-def46f5ed989	906ac55f-3fc7-4fbf-89cd-ba777fb4a5f3	2026-03-24	1	2026-03-24 15:29:37.805156	1	1	1	1
f4e28528-b0f8-4673-a74d-112a8c2364b7	8aa18a48-8e44-4bb9-b7b2-46e52706bddc	2026-03-24	1	2026-03-24 15:30:30.242862	1	1	1	1
\.


--
-- Data for Name: user_stickers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_stickers (id, user_id, sticker_id, earned_at) FROM stdin;
b00a2d50-26cd-4332-a2fd-f3d905c8fe3a	4ad2bbb3-5715-4a8f-bc03-847b3334c3de	4dce2fb2-af00-42da-90a6-cfa2653da1e2	2026-03-24 15:49:42.37475
9ca1c0f3-51c6-4d85-b36f-c17c44d7f156	7fdb62ac-745a-4033-95bc-21bc69f693be	a8352aff-2fd9-4ec8-9f73-e66fc2744c52	2026-03-24 16:12:56.433133
d37038d2-95ac-42ba-93bc-2edb06b4aa21	a1a75f59-ef6b-4c38-bc41-beebf7365df2	f14e2d83-960b-463b-a2d7-d0f8c265e4b0	2026-03-24 16:24:00.418305
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, family_id, phone, password_hash, nickname, avatar, role, level, stars, wish_points, is_active, created_at, updated_at, openid, total_stars, version) FROM stdin;
36007f5c-d6c7-4759-bb22-fa4266c10b10	b9b9861d-522f-4eb3-9873-ebb6d70abdc0	\N	\N	最终孩子		child	1	0	0	t	2026-03-24 15:31:40.6521	2026-03-24 15:31:40.6521	device_c69dnxa8758	0	1
45305cb6-3fb8-4ed0-bece-6cc69f137855	d499ef0f-0e42-46fa-90f1-f0ec9f90245a	\N	\N	贴纸测试孩子2		child	1	2	0	t	2026-03-24 15:45:34.365361	2026-03-24 15:45:34.365361	device_5a6u7nmaie4	0	1
e381f929-c11c-4fe3-acd4-1925f36581be	7536d248-99c6-4c2e-9834-919a8e47590c	13800138DEBUG2	$2a$10$FwjPKfGs39wew1LAPGU.v./XYUNovo6ntqF5medv38GdHWHRAhqrq	调试家长2		admin	1	0	0	t	2026-03-24 15:33:53.042415	2026-03-24 15:33:53.042415	\N	0	1
9c268b0e-8163-4a3f-8c35-f5a37d8a163e	7536d248-99c6-4c2e-9834-919a8e47590c	\N	\N	调试孩子2		child	1	0	0	t	2026-03-24 15:33:53.067782	2026-03-24 15:33:53.067782	device_t9sqtao3pb	0	1
2d93810d-7314-4c35-9458-19580a18e961	b2ed8173-48d2-4225-95b1-0e34d91c0825	13800138DEBUG3	$2a$10$YZpO0XKjPsfs5GqQh94sB.Xx6rFe5HGyMgcO9MYIwWoha3s4jDMMi	调试家长3		admin	1	0	0	t	2026-03-24 15:34:09.157194	2026-03-24 15:34:09.157194	\N	0	1
2ad83098-4767-44c9-8cf4-fc68878fa4ea	b2ed8173-48d2-4225-95b1-0e34d91c0825	\N	\N	调试孩子3		child	1	0	0	t	2026-03-24 15:34:09.181773	2026-03-24 15:34:09.181773	device_0js36hlz0ioi	0	1
6ad599b8-1a95-42f8-a2b9-576033d89f55	153b7dc8-7440-4235-ba17-b402c93ef8e1	13800138TESTFINAL	$2a$10$B1QcXUMz.J5yxDHnBus8/eIcAo7xPbupz27br0yUsY/P.5Dv9kMkS	最终家长		admin	1	0	0	t	2026-03-24 15:35:26.726632	2026-03-24 15:35:26.726632	\N	0	1
4cfbf4a7-634e-4a23-b002-685e38a96ec3	153b7dc8-7440-4235-ba17-b402c93ef8e1	\N	\N	最终孩子		child	1	0	0	t	2026-03-24 15:35:26.753375	2026-03-24 15:35:26.753375	device_s4msa863grq	0	1
271fdcc5-2734-488c-800e-a6396a2e469b	f4eadecc-0d2c-464e-a655-bb0087543c04	13800138QUICK	$2a$10$6LBaVACW5DAf31BkYsmYue9QdT4Exhkcd4.VPsU8a7ANgzezyQR9K	快速家长		admin	1	0	0	t	2026-03-24 15:47:25.03965	2026-03-24 15:47:25.03965	\N	0	1
c289fe12-2c72-4587-9f66-a92d02b8658b	7ffca93a-8981-4d5c-8006-06e6194763c4	13800138DEBU G	$2a$10$3u2tHhJ9Iv2VDYLrstoIpuWQZf4ypBL40oXiHn8XJLyx/8S55SBO6	调试家长		admin	1	0	0	t	2026-03-24 15:36:37.403967	2026-03-24 15:36:37.403967	\N	0	1
e7be23a2-cd76-40f6-a860-6a50c62024b3	7ffca93a-8981-4d5c-8006-06e6194763c4	\N	\N	调试孩子		child	1	0	0	t	2026-03-24 15:36:37.431709	2026-03-24 15:36:37.431709	device_s4eb070fbc	0	1
afcbdc83-ffde-4690-bd9c-cc6e93c67a91	209b8e1e-7861-4425-8beb-4b2f859ed5b1	13800138DBG4	$2a$10$80Art3K/Z2mXAsN9eRxdT.l1w4UnSZp7EqJq2/Yud0k1UxfGTD8Ua	调试家长4		admin	1	0	0	t	2026-03-24 15:37:22.227904	2026-03-24 15:37:22.227904	\N	0	1
b16a9276-afd8-4b39-848a-564e26254f55	209b8e1e-7861-4425-8beb-4b2f859ed5b1	\N	\N	调试孩子4		child	1	0	0	t	2026-03-24 15:37:22.256163	2026-03-24 15:37:22.256163	device_22c0sqhdny9	0	1
670433ec-5dde-49d8-a8dc-459171e1c4b5	f4eadecc-0d2c-464e-a655-bb0087543c04	\N	\N	快速孩子		child	1	1	0	t	2026-03-24 15:47:25.066064	2026-03-24 15:47:25.066064	device_sjsgtjycnrh	0	1
b9110cbb-f73a-4599-81f4-4972beb70df4	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	\N	\N	瑶瑶		child	1	17	0	t	2026-03-23 15:36:06.804045	2026-03-23 15:36:06.804045	device_lg48yupbbg	2	1
e219e32e-8a38-4a4f-bce6-290e24ef4dcf	7b44b6b4-3a0f-45ad-a1fa-86089585aa8e	15956239925	$2a$10$lebHjbP6j0mlVdxKUWd3duOTWwvZ8DkwdZ19qqwqmh7SJeM9cxzQq	家长		admin	1	2	0	t	2026-03-23 15:27:54.272855	2026-03-23 15:27:54.272855	\N	0	1
9e0b7bd8-c1da-4cbd-a625-4dfc080c2023	991aa133-2fcc-439d-a18e-79a17b8992bd	138001382537	$2a$10$be67t2D/7CdJUajlj7BE7.m3rABW6dsX/WJzC/rP2rJe7sIgdArYC	测试家长		admin	1	0	0	t	2026-03-24 15:25:37.53257	2026-03-24 15:25:37.53257	\N	0	1
12b1397a-3cdb-43ad-b456-59139dbf242b	3fb433db-2ef2-4d6d-b470-c84c2000d17c	138001382545	$2a$10$nuq6qzh/YE8TQr6rqLKnbewYoGzADkzqsySZFk3nKip5bkdW1SO.2	测试家长		admin	1	0	0	t	2026-03-24 15:25:45.999349	2026-03-24 15:25:45.999349	\N	0	1
3347e255-7151-4758-9d02-cea86465d406	44527035-c1b5-4cea-a4e4-d1fa00674c57	138001382556	$2a$10$mtkQjaMVjJcW2LqR1yk1QeJPJrOyQZSevzTZzM4iqIw0enEuHMJMe	测试家长		admin	1	0	0	t	2026-03-24 15:25:56.217514	2026-03-24 15:25:56.217514	\N	0	1
08c39ed6-62fd-4792-8426-e34edef633ad	44527035-c1b5-4cea-a4e4-d1fa00674c57	\N	\N	测试孩子		child	1	0	0	t	2026-03-24 15:25:56.268451	2026-03-24 15:25:56.268451	device_z4zr9v7bjv	0	1
00e5b5fb-426e-4dd8-9841-e7644d6fd611	c0479a0d-d90d-41ef-8bd4-b2b63185f501	138001382608	$2a$10$OR1X5CnZc0ysYRwBl9twFu6g3Sr2E05GL5.2mZZVjZ1xVHbePCD.2	测试家长		admin	1	0	0	t	2026-03-24 15:26:08.531246	2026-03-24 15:26:08.531246	\N	0	1
5cef9e9e-07bc-4452-a90c-55ce972629ad	74455ffb-bf69-4349-8652-77eee218bbb1	138001382622	$2a$10$wlFcAAr6duxK6GJQscrnG.qrNbE9qLIL85x6QxCB/.5vyFSDSdBrO	测试家长		admin	1	0	0	t	2026-03-24 15:26:22.867696	2026-03-24 15:26:22.867696	\N	0	1
67259408-e736-4f28-87b9-6150177364a6	74455ffb-bf69-4349-8652-77eee218bbb1	\N	\N	测试孩子		child	1	0	0	t	2026-03-24 15:26:22.90821	2026-03-24 15:26:22.90821	device_lxrcktiisee	0	1
37533c62-bc6a-4000-ada7-bbc052890db0	1ff79cd4-8fc9-4fd9-999f-9363a9bb142d	138001382637	$2a$10$kSRxx9QtUqGsFLHu0wx4h.gVGe5EvvrM73D7nRzhbERA8.sXn6RAC	测试家长		admin	1	0	0	t	2026-03-24 15:26:37.405032	2026-03-24 15:26:37.405032	\N	0	1
6ec7b154-748b-410d-97f5-26b86bf35461	1ff79cd4-8fc9-4fd9-999f-9363a9bb142d	\N	\N	测试孩子		child	1	2	0	t	2026-03-24 15:26:37.446698	2026-03-24 15:26:37.446698	device_u8a9kcdx16l	0	1
5204dea9-3150-49d3-b5e5-73a0fd5fde21	95c063d2-e102-44df-87e4-24ac77f055a0	138001382651	$2a$10$oLQj.7LR8OqG9dkYluaJl.JIoV0vLdALb.p5bPdP.tdQOMtBPs18y	测试家长		admin	1	0	0	t	2026-03-24 15:26:51.579823	2026-03-24 15:26:51.579823	\N	0	1
574ac352-0354-4496-9350-a69c9bf869ae	95c063d2-e102-44df-87e4-24ac77f055a0	\N	\N	测试孩子		child	1	0	0	t	2026-03-24 15:26:51.604512	2026-03-24 15:26:51.604512	device_fizooqmf4fb	0	1
a168e9f9-0180-42d2-9ddf-b92a8c337edb	c3b2a2f5-0b71-419e-b1d3-9a0052cf18bd	13800138STICKER	$2a$10$Agk86N6zlDqcfS.kp.AZTunNNYfM4kA78pBBgtCL5qVJDAcQP4gLW	贴纸测试家长		admin	1	0	0	t	2026-03-24 15:44:09.088486	2026-03-24 15:44:09.088486	\N	0	1
765395e6-fd89-4d9c-b56b-64060f44663e	8d60fd03-2f44-41c1-b23e-6ad72100856a	138001382706	$2a$10$B5ANIvjB9Bx8k43acoYC0uBUKR7XJCspnAXJZc9.9D9u3kNI.EOtK	测试家长		admin	1	0	0	t	2026-03-24 15:27:06.477898	2026-03-24 15:27:06.477898	\N	0	1
9696b545-ada2-4446-9a1c-a350ee404dc4	8d60fd03-2f44-41c1-b23e-6ad72100856a	\N	\N	测试孩子		child	1	0	0	t	2026-03-24 15:27:06.502447	2026-03-24 15:27:06.502447	device_quck0upv6wq	0	1
dadd4881-9de8-49f8-9689-140a1ba8306c	ed7381eb-9ce5-42c9-9a3f-257f98e15595	13800138TEST01	$2a$10$G9bDObSbKHOuM7WKNQt6sOc4t6SPcqopuzW4xD0shRwb6EEqOGu3q	测试家长		admin	1	0	0	t	2026-03-24 15:28:26.135503	2026-03-24 15:28:26.135503	\N	0	1
e5fe68ab-1bd2-486a-b01b-b89ab4edb087	ed7381eb-9ce5-42c9-9a3f-257f98e15595	\N	\N	签到测试孩子		child	1	0	0	t	2026-03-24 15:28:26.161867	2026-03-24 15:28:26.161867	device_bpgdfo5rs5	0	1
cc95a077-4c02-49b5-a5f3-bc815c7ee567	c3b2a2f5-0b71-419e-b1d3-9a0052cf18bd	\N	\N	贴纸测试孩子		child	1	2	0	t	2026-03-24 15:44:09.113545	2026-03-24 15:44:09.113545	device_7lepqc7tiyi	0	1
6d115968-70c6-490e-a6ee-458c5a0de160	96211f28-a59d-4f8d-869f-7cbe400e5fc6	13800138TEST02	$2a$10$jXccnaaRGraQViT3tq15jup/1xtEs2ggmf3p/kBjmRkmKyA.QzcpK	测试家长		admin	1	0	0	t	2026-03-24 15:28:57.69324	2026-03-24 15:28:57.69324	\N	0	1
906ac55f-3fc7-4fbf-89cd-ba777fb4a5f3	96211f28-a59d-4f8d-869f-7cbe400e5fc6	\N	\N	调试孩子		child	1	0	0	t	2026-03-24 15:28:57.715857	2026-03-24 15:28:57.715857	device_bqhbveas1uq	0	1
5231d6d0-b641-4873-bbd5-dee25b338be6	d499ef0f-0e42-46fa-90f1-f0ec9f90245a	13800138STICKER2	$2a$10$EPg5Hc3F/Wuy3JIVw3YfgeAbK0F6HfeATYFcMP6GZlUaNM26N.rfC	贴纸测试家长2		admin	1	0	0	t	2026-03-24 15:45:34.341543	2026-03-24 15:45:34.341543	\N	0	1
9f579014-d9f5-4443-bcc7-7477a6331c7c	4fa70b1c-3d2b-4fbb-a38f-28e1696ad682	13800138DEBUG1	$2a$10$A69iaykL5Lxm10QcyQ6MzOlWiSPh/Cbed1KjLgIaiUz/d.AM3eeaK	调试家长		admin	1	0	0	t	2026-03-24 15:30:30.007431	2026-03-24 15:30:30.007431	\N	0	1
8aa18a48-8e44-4bb9-b7b2-46e52706bddc	4fa70b1c-3d2b-4fbb-a38f-28e1696ad682	\N	\N	待调试孩子		child	1	1	0	t	2026-03-24 15:30:30.032687	2026-03-24 15:30:30.032687	device_wc8xjt3czk	1	1
2f02c8b1-af64-4483-9f0d-c19ac0663de1	b9b9861d-522f-4eb3-9873-ebb6d70abdc0	13800138FINAL1	$2a$10$hoDERCIlbT9Xm1EXBDWir./rMCdyvwXgoxjMNb2OnKS8AMtBX6kVq	最终家长		admin	1	0	0	t	2026-03-24 15:31:40.617023	2026-03-24 15:31:40.617023	\N	0	1
ce75ac0a-f5a4-48e2-bb94-1dda95b566e7	7dff0698-4379-4e1c-aea4-7c879758d9df	13800138STICKER3	$2a$10$7oUcjrfZMV4j.d6CD7o9M.Tw6d/MaGVYAp5GAIypQEDT/BKTHu0wa	贴纸测试3		admin	1	0	0	t	2026-03-24 15:49:42.234768	2026-03-24 15:49:42.234768	\N	0	1
4ad2bbb3-5715-4a8f-bc03-847b3334c3de	7dff0698-4379-4e1c-aea4-7c879758d9df	\N	\N	孩子3		child	1	1	0	t	2026-03-24 15:49:42.263436	2026-03-24 15:49:42.263436	device_brblgcoxeu	0	1
52b898d1-5e40-4914-9c6b-fde221cb9186	132359f5-c476-4b83-8bbf-0b156d5a33c9	13800138001	$2a$10$BwoeC2cfrqZB3hI460BQqe6YWrkEsWDc4O4dJ8InWbC5mRIzzGLHC	积分测试		admin	1	0	0	t	2026-03-24 16:12:32.396169	2026-03-24 16:12:32.396169	\N	0	1
f2c2c916-3d74-4d06-bcce-62d2bb82ca0d	132359f5-c476-4b83-8bbf-0b156d5a33c9	\N	\N	孩子A		child	1	1	0	t	2026-03-24 16:12:32.442256	2026-03-24 16:12:32.472204	device_6c0p4bmpjgm	1	2
b4f23e07-d44a-4b13-8ade-77832b3d5cf6	5d58bd89-6820-48a4-9db8-1bc7c2dd3ae4	13800138002	$2a$10$OZCF.hXl98Vp2D5x2yXfg.kceG9tiuFS4A47soVuCPe3aeXRnIzU6	审批测试		admin	1	0	0	t	2026-03-24 16:12:56.300298	2026-03-24 16:12:56.300298	\N	0	1
7fdb62ac-745a-4033-95bc-21bc69f693be	5d58bd89-6820-48a4-9db8-1bc7c2dd3ae4	\N	\N	孩子B		child	1	3	0	t	2026-03-24 16:12:56.323163	2026-03-24 16:12:56.421766	device_g5hfkp0imam	3	2
f2df023e-7644-48c1-a948-7d987c41f1b6	5264a0dc-9320-4403-913f-e78941abc86b	13800138FULL	$2a$10$U95qTQvHvNqZKf4g2WubJOyAe/tTH60hPBt4zhFkwt3Cz7GohChg.	完整测试		admin	1	0	0	t	2026-03-24 16:24:00.245615	2026-03-24 16:24:00.245615	\N	0	1
a1a75f59-ef6b-4c38-bc41-beebf7365df2	5264a0dc-9320-4403-913f-e78941abc86b	\N	\N	测试孩子		child	1	6	0	t	2026-03-24 16:24:00.288866	2026-03-24 16:24:00.410836	device_jgei4gd9vun	6	3
\.


--
-- Data for Name: weekly_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.weekly_reports (id, user_id, week_start, week_end, tasks_completed, stars_earned, tasks_detail, created_at, data, viewed) FROM stdin;
4af1857e-e35d-4293-abe5-1ec8b0c816f5	e219e32e-8a38-4a4f-bce6-290e24ef4dcf	2026-03-23	2026-03-29	0	0	{}	2026-03-23 15:45:08.034876	{"viewed": false, "signins": [], "summary": {"skipped": 0, "completed": 0, "signin_days": 0, "total_tasks": 0, "new_stickers": 0, "stars_earned": 0, "completion_rate": 0, "new_achievements": 0}, "week_end": "2026-03-29", "comparison": {"stars_change": 0, "last_week_stars": 0, "completed_change": 0, "last_week_completed": 0}, "week_start": "2026-03-23", "new_stickers": [], "daily_details": [], "user_nickname": "家长", "new_achievements": []}	f
83cd4e19-93cf-4cd7-9618-f9e732b81511	b9110cbb-f73a-4599-81f4-4972beb70df4	2026-03-23	2026-03-29	0	0	{}	2026-03-23 15:45:23.030845	{"viewed": false, "signins": [{"sign_date": "2026-03-22T16:00:00.000Z", "bonus_stars": 1, "streak_days": 1}], "summary": {"skipped": 0, "completed": 0, "signin_days": 1, "total_tasks": 0, "new_stickers": 0, "stars_earned": 0, "completion_rate": 0, "new_achievements": 0}, "week_end": "2026-03-29", "comparison": {"stars_change": 0, "last_week_stars": 0, "completed_change": 0, "last_week_completed": 0}, "week_start": "2026-03-23", "new_stickers": [], "daily_details": [], "user_nickname": "瑶瑶", "new_achievements": []}	t
d65e7504-e38d-41c9-a32b-c02ae5c96d8a	b9110cbb-f73a-4599-81f4-4972beb70df4	2026-03-16	2026-03-22	0	0	{}	2026-03-23 15:59:37.677283	{"viewed": false, "signins": [], "summary": {"skipped": 0, "completed": 0, "signin_days": 0, "total_tasks": 0, "new_stickers": 0, "stars_earned": 0, "completion_rate": 0, "new_achievements": 0}, "week_end": "2026-03-22", "comparison": {"stars_change": 0, "last_week_stars": 0, "completed_change": 0, "last_week_completed": 0}, "week_start": "2026-03-16", "new_stickers": [], "daily_details": [], "user_nickname": "瑶瑶", "new_achievements": []}	f
3c1669a3-ceac-48e1-aceb-ba54d43a1163	b9110cbb-f73a-4599-81f4-4972beb70df4	2026-03-22	2026-03-28	0	0	{}	2026-03-23 16:00:08.982101	{"viewed": false, "signins": [{"sign_date": "2026-03-22T16:00:00.000Z", "bonus_stars": 1, "streak_days": 1}], "summary": {"skipped": 0, "completed": 0, "signin_days": 1, "total_tasks": 0, "new_stickers": 0, "stars_earned": 0, "completion_rate": 0, "new_achievements": 0}, "week_end": "2026-03-28", "comparison": {"stars_change": 0, "last_week_stars": 0, "completed_change": 0, "last_week_completed": 0}, "week_start": "2026-03-22", "new_stickers": [], "daily_details": [], "user_nickname": "瑶瑶", "new_achievements": []}	f
\.


--
-- Name: achievement_definitions achievement_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievement_definitions
    ADD CONSTRAINT achievement_definitions_pkey PRIMARY KEY (id);


--
-- Name: achievement_definitions achievement_definitions_type_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.achievement_definitions
    ADD CONSTRAINT achievement_definitions_type_key UNIQUE (type);


--
-- Name: avatars avatars_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.avatars
    ADD CONSTRAINT avatars_pkey PRIMARY KEY (id);


--
-- Name: exchange_approvals exchange_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_approvals
    ADD CONSTRAINT exchange_approvals_pkey PRIMARY KEY (id);


--
-- Name: exchange_logs exchange_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_logs
    ADD CONSTRAINT exchange_logs_pkey PRIMARY KEY (id);


--
-- Name: family family_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family
    ADD CONSTRAINT family_code_key UNIQUE (code);


--
-- Name: family family_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family
    ADD CONSTRAINT family_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: point_logs point_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.point_logs
    ADD CONSTRAINT point_logs_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: rewards rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);


--
-- Name: spin_wheel_prizes spin_wheel_prizes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spin_wheel_prizes
    ADD CONSTRAINT spin_wheel_prizes_pkey PRIMARY KEY (id);


--
-- Name: stickers stickers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stickers
    ADD CONSTRAINT stickers_pkey PRIMARY KEY (id);


--
-- Name: task_logs task_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_logs
    ADD CONSTRAINT task_logs_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_achievements user_achievements_user_id_achievement_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_achievement_id_key UNIQUE (user_id, achievement_id);


--
-- Name: user_daily_spins user_daily_spins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_daily_spins
    ADD CONSTRAINT user_daily_spins_pkey PRIMARY KEY (id);


--
-- Name: user_daily_spins user_daily_spins_user_id_spin_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_daily_spins
    ADD CONSTRAINT user_daily_spins_user_id_spin_date_key UNIQUE (user_id, spin_date);


--
-- Name: user_display_settings user_display_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_display_settings
    ADD CONSTRAINT user_display_settings_pkey PRIMARY KEY (id);


--
-- Name: user_display_settings user_display_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_display_settings
    ADD CONSTRAINT user_display_settings_user_id_key UNIQUE (user_id);


--
-- Name: user_pets user_pets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_pets
    ADD CONSTRAINT user_pets_pkey PRIMARY KEY (id);


--
-- Name: user_pets user_pets_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_pets
    ADD CONSTRAINT user_pets_user_id_key UNIQUE (user_id);


--
-- Name: user_point_summary user_point_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_point_summary
    ADD CONSTRAINT user_point_summary_pkey PRIMARY KEY (user_id);


--
-- Name: user_signins user_signins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_signins
    ADD CONSTRAINT user_signins_pkey PRIMARY KEY (id);


--
-- Name: user_signins user_signins_user_id_signin_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_signins
    ADD CONSTRAINT user_signins_user_id_signin_date_key UNIQUE (user_id, sign_date);


--
-- Name: user_stickers user_stickers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stickers
    ADD CONSTRAINT user_stickers_pkey PRIMARY KEY (id);


--
-- Name: user_stickers user_stickers_user_id_sticker_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stickers
    ADD CONSTRAINT user_stickers_user_id_sticker_id_key UNIQUE (user_id, sticker_id);


--
-- Name: users users_openid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_openid_key UNIQUE (openid);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: weekly_reports weekly_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_reports
    ADD CONSTRAINT weekly_reports_pkey PRIMARY KEY (id);


--
-- Name: weekly_reports weekly_reports_user_id_week_start_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_reports
    ADD CONSTRAINT weekly_reports_user_id_week_start_key UNIQUE (user_id, week_start);


--
-- Name: idx_exchange_logs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exchange_logs_user ON public.exchange_logs USING btree (user_id, status);


--
-- Name: idx_family_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_family_code ON public.family USING btree (code);


--
-- Name: idx_goals_family_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_goals_family_user ON public.goals USING btree (family_id, user_id);


--
-- Name: idx_point_logs_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_point_logs_source ON public.point_logs USING btree (source, created_at DESC);


--
-- Name: idx_point_logs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_point_logs_user ON public.point_logs USING btree (user_id, created_at DESC);


--
-- Name: idx_refresh_tokens_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_task_logs_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_task_logs_user_date ON public.task_logs USING btree (user_id, completed_date);


--
-- Name: idx_tasks_family; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_family ON public.tasks USING btree (family_id);


--
-- Name: idx_users_family; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_family ON public.users USING btree (family_id);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: exchange_approvals exchange_approvals_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_approvals
    ADD CONSTRAINT exchange_approvals_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: exchange_approvals exchange_approvals_exchange_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_approvals
    ADD CONSTRAINT exchange_approvals_exchange_id_fkey FOREIGN KEY (exchange_id) REFERENCES public.exchange_logs(id);


--
-- Name: exchange_logs exchange_logs_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_logs
    ADD CONSTRAINT exchange_logs_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: exchange_logs exchange_logs_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_logs
    ADD CONSTRAINT exchange_logs_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(id);


--
-- Name: exchange_logs exchange_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_logs
    ADD CONSTRAINT exchange_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: family fk_family_owner; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.family
    ADD CONSTRAINT fk_family_owner FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- Name: point_logs fk_point_logs_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.point_logs
    ADD CONSTRAINT fk_point_logs_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: goals goals_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.family(id);


--
-- Name: goals goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: rewards rewards_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.family(id);


--
-- Name: spin_wheel_prizes spin_wheel_prizes_sticker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.spin_wheel_prizes
    ADD CONSTRAINT spin_wheel_prizes_sticker_id_fkey FOREIGN KEY (sticker_id) REFERENCES public.stickers(id);


--
-- Name: task_logs task_logs_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_logs
    ADD CONSTRAINT task_logs_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);


--
-- Name: task_logs task_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_logs
    ADD CONSTRAINT task_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tasks tasks_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.family(id);


--
-- Name: tasks tasks_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id);


--
-- Name: user_achievements user_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievement_definitions(id);


--
-- Name: user_achievements user_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_daily_spins user_daily_spins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_daily_spins
    ADD CONSTRAINT user_daily_spins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_display_settings user_display_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_display_settings
    ADD CONSTRAINT user_display_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_pets user_pets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_pets
    ADD CONSTRAINT user_pets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_point_summary user_point_summary_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_point_summary
    ADD CONSTRAINT user_point_summary_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_signins user_signins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_signins
    ADD CONSTRAINT user_signins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_stickers user_stickers_sticker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stickers
    ADD CONSTRAINT user_stickers_sticker_id_fkey FOREIGN KEY (sticker_id) REFERENCES public.stickers(id) ON DELETE CASCADE;


--
-- Name: user_stickers user_stickers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_stickers
    ADD CONSTRAINT user_stickers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.family(id);


--
-- Name: weekly_reports weekly_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.weekly_reports
    ADD CONSTRAINT weekly_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict G587iwnnoe1B9YCtUsO9Mg9rrVymPIpG092LQVIKGvkjWmLj87uhTP3Wd6P3XBb

