type BaseEventPayload = { 
  app?: string;
  category?: string;
} & Record<string, unknown>;

type EventHandler<PayloadType> = (event: PayloadType) => void;

type ListenerType = {
  register: () => void;
};

type GenericEventPayload = {
  id: string;
};

type EndpointEventPayload = GenericEventPayload;

export type { 
  BaseEventPayload, 
  EndpointEventPayload,
  EventHandler,
  GenericEventPayload,
  ListenerType
};
