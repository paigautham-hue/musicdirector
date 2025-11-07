import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { logApiUsage } from "../db";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;

// API tracking middleware
const apiTracker = t.middleware(async ({ ctx, next, path, type }) => {
  const startTime = Date.now();
  
  try {
    const result = await next();
    const latency = Date.now() - startTime;
    
    // Log successful API call
    await logApiUsage({
      endpoint: path,
      method: type,
      status: 'success',
      latency,
      userId: ctx.user?.id
    }).catch((err: any) => console.error('[API Tracker] Failed to log:', err));
    
    return result;
  } catch (error: any) {
    const latency = Date.now() - startTime;
    
    // Log failed API call
    await logApiUsage({
      endpoint: path,
      method: type,
      status: 'error',
      latency,
      userId: ctx.user?.id,
      errorMessage: error.message
    }).catch((err: any) => console.error('[API Tracker] Failed to log:', err));
    
    throw error;
  }
});

export const publicProcedure = t.procedure.use(apiTracker);

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(apiTracker).use(requireUser);

export const adminProcedure = t.procedure.use(apiTracker).use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
