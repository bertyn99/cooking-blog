type Formats = {
  [key: string]: sizeImg;
  small?: sizeImg;
  large?: sizeImg;
  medium?: sizeImg;
};
type SizeKey = keyof typeof Formats;

type SEO = {
  id?: number;
  description: string;
  metaRobots: string;
  keywords: string;
};
export type sizeImg = {
  url: string;
  hash: string;
  mime: string;
  name: string;
  path: string | null;
  size: number;
  width: number;
  height: number;
};

export type Cover = {
  data?: {
    id?: number;
    attributes?: {
      name?: string;
      alternativeText?: string;
      caption?: string;
      width?: number;
      height?: number;
      formats?: Formats;
      hash?: string;
      ext?: string;
      mime?: string;
      /** Format: float */
      size?: number;
      url?: string;
      previewUrl?: string;
      provider?: string;
      provider_metadata?: unknown;
      related?: {
        data?: {
          id?: number;
          attributes?: Record<string, never>;
        }[];
      };
      folder?: {
        data?: {
          id?: number;
          attributes?: {
            name?: string;
            pathId?: number;
            parent?: {
              data?: {
                id?: number;
                attributes?: Record<string, never>;
              };
            };
            children?: {
              data?: {
                id?: number;
                attributes?: Record<string, never>;
              }[];
            };
            files?: {
              data?: {
                id?: number;
                attributes?: {
                  name?: string;
                  alternativeText?: string;
                  caption?: string;
                  width?: number;
                  height?: number;
                  formats?: {
                    small?: sizeImg;
                    large?: sizeImg;
                    medium?: sizeImg;
                    thumbnail?: sizeImg;
                  };
                  hash?: string;
                  ext?: string;
                  mime?: string;
                  /** Format: float */
                  size?: number;
                  url?: string;
                  previewUrl?: string;
                  provider?: string;
                  provider_metadata?: unknown;
                  related?: {
                    data?: {
                      id?: number;
                      attributes?: Record<string, never>;
                    }[];
                  };
                  folder?: {
                    data?: {
                      id?: number;
                      attributes?: Record<string, never>;
                    };
                  };
                  folderPath?: string;
                  /** Format: date-time */
                  createdAt?: string;
                  /** Format: date-time */
                  updatedAt?: string;
                  createdBy?: {
                    data?: {
                      id?: number;
                      attributes?: {
                        firstname?: string;
                        lastname?: string;
                        username?: string;
                        /** Format: email */
                        email?: string;
                        resetPasswordToken?: string;
                        registrationToken?: string;
                        isActive?: boolean;
                        roles?: {
                          data?: {
                            id?: number;
                            attributes?: {
                              name?: string;
                              code?: string;
                              description?: string;
                              users?: {
                                data?: {
                                  id?: number;
                                  attributes?: Record<string, never>;
                                }[];
                              };
                              permissions?: {
                                data?: {
                                  id?: number;
                                  attributes?: {
                                    action?: string;
                                    subject?: string;
                                    properties?: unknown;
                                    conditions?: unknown;
                                    role?: {
                                      data?: {
                                        id?: number;
                                        attributes?: Record<string, never>;
                                      };
                                    };
                                    /** Format: date-time */
                                    createdAt?: string;
                                    /** Format: date-time */
                                    updatedAt?: string;
                                    createdBy?: {
                                      data?: {
                                        id?: number;
                                        attributes?: Record<string, never>;
                                      };
                                    };
                                    updatedBy?: {
                                      data?: {
                                        id?: number;
                                        attributes?: Record<string, never>;
                                      };
                                    };
                                  };
                                }[];
                              };
                              /** Format: date-time */
                              createdAt?: string;
                              /** Format: date-time */
                              updatedAt?: string;
                              createdBy?: {
                                data?: {
                                  id?: number;
                                  attributes?: Record<string, never>;
                                };
                              };
                              updatedBy?: {
                                data?: {
                                  id?: number;
                                  attributes?: Record<string, never>;
                                };
                              };
                            };
                          }[];
                        };
                        blocked?: boolean;
                        preferedLanguage?: string;
                        /** Format: date-time */
                        createdAt?: string;
                        /** Format: date-time */
                        updatedAt?: string;
                        createdBy?: {
                          data?: {
                            id?: number;
                            attributes?: Record<string, never>;
                          };
                        };
                        updatedBy?: {
                          data?: {
                            id?: number;
                            attributes?: Record<string, never>;
                          };
                        };
                      };
                    };
                  };
                  updatedBy?: {
                    data?: {
                      id?: number;
                      attributes?: Record<string, never>;
                    };
                  };
                };
              }[];
            };
            path?: string;
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
            createdBy?: {
              data?: {
                id?: number;
                attributes?: Record<string, never>;
              };
            };
            updatedBy?: {
              data?: {
                id?: number;
                attributes?: Record<string, never>;
              };
            };
          };
        };
      };
      folderPath?: string;
      /** Format: date-time */
      createdAt?: string;
      /** Format: date-time */
      updatedAt?: string;
      createdBy?: {
        data?: {
          id?: number;
          attributes?: Record<string, never>;
        };
      };
      updatedBy?: {
        data?: {
          id?: number;
          attributes?: Record<string, never>;
        };
      };
    };
  };
};
export type Category = {
  data?: {
    id?: number;
    attributes?: {
      name?: string;
      desc?: string;
      img?: {
        data?: {
          id?: number;
          attributes?: {
            name?: string;
            alternativeText?: string;
            caption?: string;
            width?: number;
            height?: number;
            formats?: {
              small?: sizeImg;
              large?: sizeImg;
              medium?: sizeImg;
              thumbnail?: sizeImg;
            };
            hash?: string;
            ext?: string;
            mime?: string;
            /** Format: float */
            size?: number;
            url?: string;
            previewUrl?: string;
            provider?: string;
            provider_metadata?: unknown;
            related?: {
              data?: {
                id?: number;
                attributes?: Record<string, never>;
              }[];
            };
            /** Format: date-time */
            createdAt?: string;
            /** Format: date-time */
            updatedAt?: string;
            createdBy?: {
              data?: {
                id?: number;
                attributes?: Record<string, never>;
              };
            };
            updatedBy?: {
              data?: {
                id?: number;
                attributes?: Record<string, never>;
              };
            };
          };
        }[];
      };

      /** Format: date-time */
      createdAt?: string;
      /** Format: date-time */
      updatedAt?: string;
      /** Format: date-time */
      publishedAt?: string;
      createdBy?: {
        data?: {
          id?: number;
          attributes?: Record<string, never>;
        };
      };
      updatedBy?: {
        data?: {
          id?: number;
          attributes?: Record<string, never>;
        };
      };
      localizations?: {
        data?: unknown[];
      };
      locale?: string;
    };
  }[];
};
export type Ingredient = {
  id?: number;
  name?: string;
  /** Format: float */
  qty?: number;
  /** @enum {string} */
  unit?:
    | "none"
    | "g"
    | "kg"
    | "l"
    | "cuillère a soupe"
    | "cuillère à café"
    | "tasse";
};
export type Recipe = {
  data?: {
    id?: number;
    attributes?: {
      title?: string;
      Intro?: string;
      cover?: Cover;
      Ingredient?: Ingredient[];
      categories?: {
        data?: {
          id?: number;
          attributes?: Record<string, never>;
        }[];
      };
      seo?: SEO;
      step?: string;
      slug?: string;
      /** @enum {string} */
      difficulty?: "easy" | "medium" | "hard";
      time?: number;
      /** Format: date-time */
      createdAt?: string;
      /** Format: date-time */
      updatedAt?: string;
      /** Format: date-time */
      publishedAt?: string;
      createdBy?: {
        data?: {
          id?: number;
          attributes?: Record<string, never>;
        };
      };
      localizations?: {
        data?: unknown[];
      };
      locale?: string;
    };
  }[];
};
export type Article = {
  id?: number;
  attributes?: {
    content?: string;
    title?: string;
    cover?: Cover;
    categories?: Category;
    slug?: string;
    createdAt?: string;
    seo?: SEO;
    updatedAt?: string;
    publishedAt?: string;
    createdBy?: {
      data?: {
        id?: number;
        attributes?: Record<string, never>;
      };
    };
    updatedBy?: {
      data?: {
        id?: number;
        attributes?: Record<string, never>;
      };
    };
    localizations?: {
      data?: components["schemas"]["ArticleListResponseDataItemLocalized"][];
    };
    locale?: string;
  };
};
