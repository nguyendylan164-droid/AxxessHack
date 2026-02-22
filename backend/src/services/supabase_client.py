import os
from supabase import create_client, Client


def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    # Prefer service role key (server-side); fall back to SUPABASE_KEY for local .env
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

    if not url or not service_key:
        raise RuntimeError(
            "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY in environment."
        )

    return create_client(url, service_key)
