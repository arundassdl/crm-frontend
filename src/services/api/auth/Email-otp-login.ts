const disabledAuth = async (..._args: any[]): Promise<any> => {
  throw new Error("Use centralized EVOQ sign-in.");
};
export default disabledAuth;
