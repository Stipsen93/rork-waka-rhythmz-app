import { createTRPCRouter } from "@/backend/trpc/create-context";
import hiRoute from "@/backend/trpc/routes/example/hi/route";
import { getStorageUsageRoute } from "@/backend/trpc/routes/media/get-storage-usage/route";
import { getMediaListRoute } from "@/backend/trpc/routes/media/get-media-list/route";
import { getFoldersRoute } from "@/backend/trpc/routes/media/get-folders/route";
import { deleteMediaRoute } from "@/backend/trpc/routes/media/delete-media/route";
import { uploadMediaRoute } from "@/backend/trpc/routes/media/upload-media/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  media: createTRPCRouter({
    getStorageUsage: getStorageUsageRoute,
    getMediaList: getMediaListRoute,
    getFolders: getFoldersRoute,
    deleteMedia: deleteMediaRoute,
    uploadMedia: uploadMediaRoute,
  }),
});

export type AppRouter = typeof appRouter;
