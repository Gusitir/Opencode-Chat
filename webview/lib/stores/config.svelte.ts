interface ModelInfo {
  provider: string;
  model: string;
  label: string;
}

class ConfigStore {
  models = $state<ModelInfo[]>([]);
  selectedModel = $state<{ provider: string; model: string } | null>(null);

  setModels(models: ModelInfo[]) {
    this.models = models;
  }

  selectModel(provider: string, model: string) {
    this.selectedModel = { provider, model };
  }
}

export const configStore = new ConfigStore();
