import type { Instrumentation } from "next"
import { reportServerError } from "@/lib/monitoring"

export async function register() {
  // Telemetry hook reserved for runtime initialization
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  await reportServerError(error, {
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  })
}
