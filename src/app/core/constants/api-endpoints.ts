import { environment } from "../../../environments/environment";

const base = environment.apiBaseUrl;

export const ApiEndpoints = {
  auth: {
    login: `${base}/login`,
  },
  joinRequests: {
    create: `${base}/join-requests`,
    getAll: `${base}/join-requests`,
    approve: (id: string) => `${base}/join-requests/${id}/approve`,
    reject: (id: string) => `${base}/join-requests/${id}/reject`,
    getApproved: `${base}/approved-members`,
    getMember: (id: string) => `${base}/members/${id}`,
    updateVolunteerHours: (id: string) => `${base}/members/${id}/volunteer-hours`,
  },
  profile: {
    get: `${base}/profile`,
    updatePassword: `${base}/profile/password`,
    uploadImage: `${base}/profile/image`,
    updateProfile: `${base}/profile/update`,
  },
};