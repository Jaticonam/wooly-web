import { useMemo, useState } from "react";
import {
  ArrowLeft, Megaphone, Plus, Pencil,
  RefreshCw, PackageOpen, LockKeyhole,
  ChevronRight,
} from "lucide-react";

import AdminShell from "@/modules/admin/components/AdminShell/AdminShell";
import { useAdminAuth } from "@/modules/admin-auth/context/AdminAuthContext";

import CatalogMasterFormModal, {
  type CatalogMasterEditor,
} from "@/modules/catalog-settings/components/CatalogMasterFormModal";

import { mapCoreCatalogCampaign } from "@/modules/catalog-tools/integrations/CoreCatalogCampaigns";

import { useAdminProducts } from "@/modules/products-admin/hooks/useAdminProducts";

import ProductAdminExplorer from "@/modules/products-admin/components/ProductAdminExplorer/ProductAdminExplorer";
import ProductsToolbar from "@/modules/products-admin/components/ProductsToolbar/ProductsToolbar";

import {
  DEFAULT_PRODUCT_ADMIN_COLUMNS,
  type ProductAdminColumnVisibility,
  type ProductAdminDensity,
} from "@/modules/products-admin/domain/ProductAdminDisplay";

import type { ProductAdminViewMode } from "@/modules/products-admin/domain/ProductAdminViewMode";
import { summarizeProductAdminOperations } from "@/modules/products-admin/domain/ProductAdminOperationalState";
import ProductDetailDrawer from "@/modules/products-admin/components/ProductDetailDrawer/ProductDetailDrawer";

import {
  EMPTY_PRODUCT_ADMIN_FILTERS,
  hasActiveProductAdminFilters,
  filterAdminProducts,
} from "@/modules/products-admin/domain/ProductAdminFilters";

import {
  toggleProductAdminSelection,
  toggleVisibleProductAdminSelection,
  areAllVisibleProductsSelected,
} from "@/modules/products-admin/domain/ProductAdminSelection";

import type { Product } from "@wooly/contracts/types/product";

import "./CampaignsAdminPage.css";

type Workspace = "registry" | "campaign" | "add";

const CAMPAIGN_COLUMNS = {
  image: true,
  status: false,
  price: false,
  stock: false,
  category: true,
  priority: false,
};

function statusLabel(status: string) {
  switch (status.toUpperCase()) {
    case "PUBLISHED": return "Publicada";
    case "DRAFT": return "Borrador";
    case "ARCHIVED": return "Archivada";
    case "HIDDEN": return "Oculta";
    default: return status;
  }
}

export default function CampaignsAdminPage() {
  const auth = useAdminAuth();
  const brandId = auth.configuration?.brandId;

  const canWrite = !!brandId && !!auth.session?.accesses.some(
    (access) =>
      access.brand.id === brandId &&
      ["OWNER", "ADMIN"].includes(access.role.toUpperCase()),
  );

  const definitions = auth.configuration?.campaigns ?? [];
  const catalog = useAdminProducts(brandId);

  const campaigns = useMemo(
    () => (auth.configuration?.campaigns ?? []).map(
      (campaign) => mapCoreCatalogCampaign({
        ...campaign,
        brandId: brandId ?? "",
      }),
    ),
    [auth.configuration?.campaigns, brandId],
  );

  const [workspace, setWorkspace] = useState<Workspace>("registry");
  const [campaignId, setCampaignId] = useState("");
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const [addFilters, setAddFilters] = useState(
    EMPTY_PRODUCT_ADMIN_FILTERS,
  );

  const [campaignViewMode, setCampaignViewMode] =
    useState<ProductAdminViewMode>("table");

  const [addViewMode, setAddViewMode] =
    useState<ProductAdminViewMode>("grid");

  const [addDensity, setAddDensity] =
    useState<ProductAdminDensity>("comfortable");

  const [addColumns, setAddColumns] =
    useState<ProductAdminColumnVisibility>(
      DEFAULT_PRODUCT_ADMIN_COLUMNS,
    );

  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  const [editor, setEditor] = useState<CatalogMasterEditor | null>(null);
  const [detail, setDetail] = useState<Product | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  const current = definitions.find((item) => item.id === campaignId);
  const ready = catalog.isFullCatalogLoaded && !catalog.error;

  const belongs = (product: Product, id: string) =>
    (product.campaigns ?? []).includes(id);

  const assigned = current
    ? catalog.data.filter((product) => belongs(product, current.id))
    : [];

  const available = current
    ? catalog.data.filter((product) => !belongs(product, current.id))
    : [];

  // La vista de campaña nunca recibe el catálogo general.
  const scopedProducts =
    workspace === "campaign" ? assigned :
    workspace === "add" ? available : [];

  const filtered = filterAdminProducts(
    scopedProducts,
    workspace === "add"
      ? addFilters
      : {
          ...EMPTY_PRODUCT_ADMIN_FILTERS,
          search,
          categoryId: category,
        },
  );

  const operationalSummary =
    summarizeProductAdminOperations(filtered);

  const visibleIds = filtered.map((product) => product.id);

  const selectedCount = scopedProducts.filter(
    (product) => selected.has(product.id),
  ).length;

  const visibleSelectedCount = filtered.filter(
    (product) => selected.has(product.id),
  ).length;

  const hiddenSelectedCount =
    selectedCount - visibleSelectedCount;

  const allSelected = areAllVisibleProductsSelected(
    selected,
    visibleIds,
  );

  const filteredCampaigns = definitions.filter((campaign) => {
    const term = campaignSearch.trim().toLocaleLowerCase("es");

    const matchesSearch = [
      campaign.name,
      campaign.code,
      campaign.slug,
    ].some((value) =>
      value.toLocaleLowerCase("es").includes(term),
    );

    const matchesStatus =
      !campaignStatus ||
      campaign.publicationStatus === campaignStatus;

    return matchesSearch && matchesStatus;
  });

  const resetProductSelection = () => {
    setSearch("");
    setCategory("");
    setAddFilters(EMPTY_PRODUCT_ADMIN_FILTERS);
    setSelected(new Set<string>());
    setDetail(null);
  };

  const openCampaign = (id: string) => {
    resetProductSelection();
    setCampaignId(id);
    setWorkspace("campaign");
  };

  const openRegistry = () => {
    resetProductSelection();
    setCampaignId("");
    setWorkspace("registry");
  };

  const openAddProducts = () => {
    resetProductSelection();
    setWorkspace("add");
  };

  const returnToCampaign = () => {
    resetProductSelection();
    setWorkspace("campaign");
  };

  const refresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    setRefreshError("");

    try {
      await auth.refresh({ background: true });
      await catalog.reload();
      resetProductSelection();
    } catch {
      setRefreshError("No se pudo completar la actualización.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <AdminShell title="Campañas" subtitle="Gestión comercial">
      <main className="campaigns-admin">

        {refreshError && <p role="alert">{refreshError}</p>}

        {workspace === "registry" && (
          <>
            <header className="campaigns-admin__header">
              <div>
                <h1>Campañas comerciales</h1>
                <p>Organiza tus temporadas y estrategias comerciales.</p>
              </div>

              <div className="campaigns-admin__actions">
                <button
                  type="button"
                  disabled={refreshing}
                  onClick={() => void refresh()}
                >
                  <RefreshCw size={16} />
                  Actualizar
                </button>

                {canWrite && (
                  <button
                    type="button"
                    className="is-primary"
                    onClick={() => setEditor({
                      kind: "campaign",
                      entity: null,
                    })}
                  >
                    <Plus size={16} /> Nueva campaña
                  </button>
                )}
              </div>
            </header>

            <section className="campaigns-admin__surface">
              <div className="campaigns-admin__filters">
                <label>
                  <span>Buscar campaña</span>
                  <input
                    type="search"
                    placeholder="Nombre o código"
                    value={campaignSearch}
                    onChange={(event) =>
                      setCampaignSearch(event.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Estado</span>
                  <select
                    value={campaignStatus}
                    onChange={(event) =>
                      setCampaignStatus(event.target.value)
                    }
                  >
                    <option value="">Todos los estados</option>
                    {Array.from(new Set(
                      definitions.map((item) => item.publicationStatus),
                    )).map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="campaigns-admin__tableScroll">
                <table className="campaigns-admin__table">
                  <thead>
                    <tr>
                      <th>Campaña</th>
                      <th>Estado</th>
                      <th>Productos asociados</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCampaigns.map((campaign) => (
                      <tr key={campaign.id}>
                        <td>
                          <div className="campaigns-admin__identity">
                            <Megaphone size={20} />
                            <div>
                              <strong>{campaign.name}</strong>
                              <small>{campaign.code}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="campaigns-admin__status">
                            {statusLabel(campaign.publicationStatus)}
                          </span>
                        </td>

                        <td>
                          {ready
                            ? catalog.data.filter(
                                (product) => belongs(product, campaign.id),
                              ).length
                            : "—"}
                        </td>

                        <td>
                          <div className="campaigns-admin__actions">
                            {canWrite && (
                              <button
                                type="button"
                                aria-label={`Editar ${campaign.name}`}
                                onClick={() => setEditor({
                                  kind: "campaign",
                                  entity: campaign,
                                })}
                              >
                                <Pencil size={15} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => openCampaign(campaign.id)}
                            >
                              Gestionar <ChevronRight size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredCampaigns.length === 0 && (
                <p>No hay campañas para los filtros seleccionados.</p>
              )}

              <p>
                {filteredCampaigns.length} de {definitions.length} campañas
              </p>

              {catalog.error && (
                <p role="alert">
                  No se pudieron consultar las relaciones de productos.
                </p>
              )}
            </section>
          </>
        )}

        {workspace !== "registry" && current && (
          <>
            <div className="campaigns-admin__actions">
              <button
                type="button"
                onClick={
                  workspace === "add"
                    ? returnToCampaign
                    : openRegistry
                }
              >
                <ArrowLeft size={16} />
                {workspace === "add"
                  ? "Volver a la campaña"
                  : "Volver a campañas"}
              </button>
            </div>

            <header className="campaigns-admin__header">
              <div>
                <h1>
                  {workspace === "add"
                    ? "Agregar productos"
                    : current.name}
                </h1>

                <p>
                  {workspace === "add"
                    ? current.name
                    : `${current.code} · ${statusLabel(current.publicationStatus)}`}
                </p>
              </div>

              {workspace === "campaign" && canWrite && (
                <button
                  type="button"
                  onClick={() => setEditor({
                    kind: "campaign",
                    entity: current,
                  })}
                >
                  <Pencil size={15} /> Editar campaña
                </button>
              )}
            </header>

            <section className="campaigns-admin__surface">
              <div className="campaigns-admin__header">
                <h2>
                  {workspace === "campaign"
                    ? "Productos asociados"
                    : "Productos disponibles para asignar"}
                  {ready ? ` (${scopedProducts.length})` : ""}
                </h2>

                {workspace === "campaign" && canWrite && (
                  <button
                    type="button"
                    className="is-primary"
                    disabled={!ready}
                    onClick={openAddProducts}
                  >
                    <Plus size={16} /> Agregar productos
                  </button>
                )}
              </div>

              {catalog.error ? (
                <p role="alert">
                  No se pudieron consultar los productos de CORE.
                </p>
              ) : !ready ? (
                <p role="status">Consultando productos...</p>
              ) : scopedProducts.length === 0 ? (
                <div className="campaigns-admin__empty">
                  <PackageOpen size={42} />

                  <h2>
                    {workspace === "campaign"
                      ? "Esta campaña aún no tiene productos"
                      : "No quedan productos disponibles"}
                  </h2>

                  <p>
                    {workspace === "campaign"
                      ? "Agrega productos existentes para organizar tu campaña."
                      : "Todos los productos ya pertenecen a esta campaña."}
                  </p>

                  {workspace === "campaign" && canWrite && (
                    <button
                      type="button"
                      className="is-primary"
                      onClick={openAddProducts}
                    >
                      <Plus size={16} /> Agregar productos
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className={
                    workspace === "add"
                      ? "campaigns-admin__assignment-controls"
                      : "campaigns-admin__standard-controls"
                  }>
                  {workspace === "add" ? (
                    <ProductsToolbar
                      filters={addFilters}
                      categories={catalog.categories}
                      campaigns={campaigns.filter(
                        (campaign) => campaign.id !== current.id,
                      )}
                      resultCount={filtered.length}
                      visibleCount={operationalSummary.visible}
                      sellableCount={operationalSummary.sellable}
                      viewMode={addViewMode}
                      density={addDensity}
                      columns={addColumns}
                      hasActiveFilters={
                        hasActiveProductAdminFilters(addFilters)
                      }
                      onFiltersChange={setAddFilters}
                      onViewModeChange={setAddViewMode}
                      onDensityChange={setAddDensity}
                      onToggleColumn={(key) =>
                        setAddColumns((previous) => ({
                          ...previous,
                          [key]: !previous[key],
                        }))
                      }
                      onClear={() =>
                        setAddFilters(EMPTY_PRODUCT_ADMIN_FILTERS)
                      }
                    />
                  ) : (
                    <>
                      <div className="campaigns-admin__filters">
                        <label>
                          <span>Buscar productos asociados</span>
                          <input
                            type="search"
                            value={search}
                            placeholder="Nombre, código o descripción"
                            onChange={(event) =>
                              setSearch(event.target.value)
                            }
                          />
                        </label>

                        <label>
                          <span>Categoría</span>
                          <select
                            value={category}
                            onChange={(event) =>
                              setCategory(event.target.value)
                            }
                          >
                            <option value="">Todas las categorías</option>

                            {catalog.categories.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <div
                        className="campaigns-admin__actions"
                        role="group"
                        aria-label="Vista de productos asociados"
                      >
                        <span>Vista:</span>

                        {([
                          ["grid", "Tarjetas"],
                          ["list", "Filas"],
                          ["table", "Tabla"],
                        ] as const).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={campaignViewMode === value}
                            className={
                              campaignViewMode === value
                                ? "is-primary"
                                : ""
                            }
                            onClick={() => setCampaignViewMode(value)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="campaigns-admin__selection">
                    <strong>
                      {selectedCount} seleccionados
                      {hiddenSelectedCount > 0
                        ? ` · ${hiddenSelectedCount} fuera de los filtros actuales`
                        : ""}
                    </strong>

                    <button
                      type="button"
                      disabled={visibleIds.length === 0}
                      onClick={() =>
                        setSelected((previous) =>
                          toggleVisibleProductAdminSelection(
                            previous,
                            visibleIds,
                          ),
                        )
                      }
                    >
                      {allSelected
                        ? "Deseleccionar visibles"
                        : "Seleccionar visibles"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelected(new Set<string>())}
                    >
                      Limpiar selección
                    </button>

                    {canWrite && (
                      <button type="button" disabled>
                        {workspace === "add"
                          ? `Agregar (${selectedCount})`
                          : `Desasignar (${selectedCount})`}
                      </button>
                    )}
                  </div>
                  </div>

                  <ProductAdminExplorer
                    products={filtered}
                    campaigns={campaigns}
                    viewMode={
                      workspace === "add"
                        ? addViewMode
                        : campaignViewMode
                    }
                    density={
                      workspace === "add"
                        ? addDensity
                        : "compact"
                    }
                    columns={
                      workspace === "add"
                        ? addColumns
                        : CAMPAIGN_COLUMNS
                    }
                    isReady={ready}
                    selectedProductIds={selected}
                    onSelectProduct={setDetail}
                    onToggleProductSelection={(product) =>
                      setSelected((previous) =>
                        toggleProductAdminSelection(
                          previous,
                          product.id,
                        ),
                      )
                    }
                  />
                </>
              )}

              {workspace === "add" && (
                <div className="campaigns-admin__notice" role="status">
                  <LockKeyhole size={15} />
                  La asignación definitiva requiere el contrato seguro de CORE.
                </div>
              )}

              {workspace === "campaign" && selectedCount > 0 && (
                <div className="campaigns-admin__notice" role="status">
                  <LockKeyhole size={15} />
                  Desasignación pendiente de habilitación en CORE.
                </div>
              )}
            </section>
          </>
        )}

        {workspace !== "registry" && !current && (
          <section className="campaigns-admin__surface">
            <p>La campaña seleccionada ya no está disponible.</p>
            <button type="button" onClick={openRegistry}>
              Volver a campañas
            </button>
          </section>
        )}

        <ProductDetailDrawer
          product={detail}
          campaigns={campaigns}
          open={detail !== null}
          onOpenChange={(open) => {
            if (!open) setDetail(null);
          }}
        />

        <CatalogMasterFormModal
          open={editor !== null}
          editor={editor}
          brandId={brandId ?? ""}
          canWrite={canWrite}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            setEditor(null);
            await refresh();
          }}
        />
      </main>
    </AdminShell>
  );
}