export type RootStackParamList = {
  Login: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  TrelloSignIn: undefined;
  TeamList: undefined;
  UserDetail: { userId: string; email: string; department: string }; // 👈 expects userId param
};
