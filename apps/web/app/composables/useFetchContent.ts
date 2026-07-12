/** @deprecated Use useStrapi().find() instead */
export const useFetchContent = (_url: string) => {
  return {
    find: async <T>(_contentName: string): Promise<T | null> => null,
  };
};
