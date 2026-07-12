export const useFetchContent = (url: string) => {
  const find = <T>(contentName: string): Promise<T> => {
    return $fetch(`/${contentName}`, { method: "GET" });
  };
};
