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
    updateMemberDetails: (id: string) => `${base}/members/${id}/update-details`,
    addStudent: (id: string) => `${base}/members/${id}/add-student`,
  },
  profile: {
    get: `${base}/profile`,
    updatePassword: `${base}/profile/password`,
    uploadImage: `${base}/profile/image`,
    addMeeting: `${base}/profile/meetings`,
    updateMeeting: (meetingId: string) => `${base}/profile/meetings/${meetingId}`,
    deleteMeeting: (meetingId: string) => `${base}/profile/meetings/${meetingId}`,
  },
  pdf: {
    upload: `${base}/pdf/upload`,
    list: `${base}/pdf/list`,
    delete: (id: string) => `${base}/pdf/${id}`,
    view: (id: string) => `${base}/pdf/view/${id}`,
  },
};
