import { Settings } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./settings-form";

type BusinessSettings = {
  id: string;
  name: string;
  whatsapp: string | null;
  address: string | null;
  instagram: string | null;
};

export default async function ConfiguracoesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_settings")
    .select(`
      id,
      name,
      whatsapp,
      address,
      instagram
    `)
    .order("created_at", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  const settings = data as BusinessSettings | null;

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <div className="admin-eyebrow">
            ADMINISTRAÇÃO
          </div>

          <h1 className="admin-title">
            Configurações
          </h1>

          <p className="admin-subtitle">
            Gerencie as informações gerais da Black Navalha.
          </p>
        </div>

        <Settings
          size={28}
          color="#c89b58"
          aria-hidden="true"
        />
      </div>

      {error && (
        <div className="admin-error">
          Não foi possível carregar as configurações:{" "}
          {error.message}
        </div>
      )}

      {!error && (
        <SettingsForm initialData={settings} />
      )}
    </main>
  );
}
