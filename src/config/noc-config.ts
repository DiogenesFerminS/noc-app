import { envs } from "./plugins/envs.plugin.js";

// Forma de cada dominio devuelto por el endpoint /noc/config de Odoo.
export interface NocDomainConfig {
    id: number;
    name: string;
    url: string;
    emails: string[];
}

// Lee los dominios + correos configurados en Odoo.
// Devuelve el arreglo (posiblemente vacío) si Odoo respondió, o `null` si la
// llamada falló: así el caller puede distinguir "0 dominios" de "Odoo caído"
// y no borrar el monitoreo actual por una falla temporal.
export const getNocConfig = async (): Promise<NocDomainConfig[] | null> => {
    try {
        const res = await fetch(envs.NOC_CONFIG_URL);

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        return data as NocDomainConfig[];
    } catch (error) {
        const message = error instanceof Error ? error.message : 'error desconocido';
        console.error(
            `No se pudo cargar la configuración del NOC desde Odoo (${envs.NOC_CONFIG_URL}): ${message}`
        );
        return null;
    }
};
