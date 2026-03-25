import { toast, ToastContent, ToastOptions } from "react-toastify";

export const showToast = (message: ToastContent, type: "success" | "warning" | "error" | "default" = "default") => {
  const toastConfig: ToastOptions = {
    autoClose: 5000,
    hideProgressBar: false,
  };

  switch (type) {
    case "success":
      toast.success(message, toastConfig);
      break;
    case "warning":
      toast.warning(message, toastConfig);
      break;
    case "error":
      toast.error(message, toastConfig);
      break;
    default:
      toast(message, toastConfig);
  }
};
