import { createTRPCRouter } from "@/backend/trpc/create-context";
import hiRoute from "@/backend/trpc/routes/example/hi/route";
import { getStorageUsageRoute } from "@/backend/trpc/routes/media/get-storage-usage/route";
import { getMediaListRoute } from "@/backend/trpc/routes/media/get-media-list/route";
import { getFoldersRoute } from "@/backend/trpc/routes/media/get-folders/route";
import { deleteMediaRoute } from "@/backend/trpc/routes/media/delete-media/route";
import { uploadMediaRoute } from "@/backend/trpc/routes/media/upload-media/route";
import { createFolderRoute } from "@/backend/trpc/routes/media/create-folder/route";
import { deleteAccountProcedure } from "@/backend/trpc/routes/users/delete-account/route";
import { reactivateAccountProcedure } from "@/backend/trpc/routes/users/reactivate-account/route";
import { permanentDeleteAccountProcedure } from "@/backend/trpc/routes/users/permanent-delete-account/route";
import { registerTokenProcedure } from "@/backend/trpc/routes/notifications/register-token/route";
import { unregisterTokenProcedure } from "@/backend/trpc/routes/notifications/unregister-token/route";
import { getUserTokensProcedure } from "@/backend/trpc/routes/notifications/get-user-tokens/route";
import { sendNotificationProcedure } from "@/backend/trpc/routes/notifications/send-notification/route";

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
    createFolder: createFolderRoute,
  }),
  users: createTRPCRouter({
    deleteAccount: deleteAccountProcedure,
    reactivateAccount: reactivateAccountProcedure,
    permanentDeleteAccount: permanentDeleteAccountProcedure,
  }),
  notifications: createTRPCRouter({
    registerToken: registerTokenProcedure,
    unregisterToken: unregisterTokenProcedure,
    getUserTokens: getUserTokensProcedure,
    sendNotification: sendNotificationProcedure,
  }),
});

export type AppRouter = typeof appRouter;
