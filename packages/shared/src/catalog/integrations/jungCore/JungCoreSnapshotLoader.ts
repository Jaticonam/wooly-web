/**
 * Frontera de transporte para obtener un snapshot.
 *
 * El provider no conoce HTTP, URLs, autenticación ni variables
 * de entorno. Esas responsabilidades pertenecen al loader real
 * que se implemente en una fase posterior.
 */
export interface JungCoreSnapshotLoader {
  loadSnapshot(): Promise<unknown>;
}