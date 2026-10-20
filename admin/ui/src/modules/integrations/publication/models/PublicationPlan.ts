/**
 * ============================================================
 * JUNG Candidate Module
 * Module: Publication Plan
 * Domain: Commercial Core
 * Status: Development
 *
 * Purpose:
 * Define la estrategia comercial de publicación antes de enviar
 * productos a cualquier conector externo.
 *
 * Filosofía:
 * Primero validamos en el negocio.
 * Después estandarizamos para la plataforma.
 * ============================================================
 */

export type PublicationMode = "all" | "campaign" | "category" | "collection" | "selected";

export type PublicationSortBy = "priority" | "score" | "updated" | "price" | "title";

export type PublicationSortDirection = "asc" | "desc";

export interface PublicationPlan {
  id: string;
  name: string;
  description?: string;
  connector: string;
  enabled: boolean;
  mode: PublicationMode;
  filters?: {
    campaign?: string;
    category?: string;
    ids?: string[];
    collection?: string;
    status?: string[];
    minimumScore?: number;
    excludeWarnings?: boolean;
    excludeOutOfStock?: boolean;
    excludePreorder?: boolean;
  };
  sorting?: {
    by: PublicationSortBy;
    direction: PublicationSortDirection;
  };
  limit?: number;
  randomize?: boolean;
}
