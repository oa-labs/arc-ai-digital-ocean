import toast from 'react-hot-toast';

/**
 * Toast notification utilities
 * Replaces browser alert() with user-friendly toast messages
 */

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 4000,
      position: 'top-right',
    });
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
    });
  },

  info: (message: string) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
    });
  },

  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },
};

/**
 * Async operation with loading toast
 * Shows loading toast, then success or error based on result
 */
export async function withToast<T>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
): Promise<T> {
  return toast.promise(
    promise,
    {
      loading: options.loading,
      success: options.success,
      error: options.error,
    },
    {
      position: 'top-right',
    }
  );
}

