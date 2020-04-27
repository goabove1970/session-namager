-- Table: public.session

-- DROP TABLE public.session;

CREATE TABLE public.session
(
    session_id character varying COLLATE pg_catalog."default" NOT NULL,
    login_timestamp date NOT NULL,
    session_data character varying COLLATE pg_catalog."default",
    CONSTRAINT session_pkey PRIMARY KEY (session_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.session
    OWNER to postgres;