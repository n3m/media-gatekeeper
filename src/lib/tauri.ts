import { invoke } from "@tauri-apps/api/core";
import type { Creator, CreateCreatorRequest, UpdateCreatorRequest } from "@/types/creator";

export const api = {
  creators: {
    getAll: () => invoke<Creator[]>("get_creators"),
    get: (id: string) => invoke<Creator>("get_creator", { id }),
    create: (request: CreateCreatorRequest) => invoke<Creator>("create_creator", { request }),
    update: (id: string, request: UpdateCreatorRequest) => invoke<Creator>("update_creator", { id, request }),
    delete: (id: string) => invoke<void>("delete_creator", { id }),
  },
};
