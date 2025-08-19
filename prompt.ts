import { wrapper } from "./decorators.ts";

@wrapper
export class PromptNode {
  async add_item({ item }: { item: string | string[] }): Promise<PromptNode> {
    const _ = item;
    return new PromptNode();
  }

  async remove_item({ item }: { item: string }): Promise<PromptNode> {
    return new PromptNode();
  }

  async clear_items(): Promise<PromptNode> {
    return new PromptNode();
  }

  async add_node({ name }: { name: string }): Promise<PromptNode> {
    return new PromptNode();
  }

  async node({ name }: { name: string }): Promise<PromptNode> {
    return new PromptNode();
  }

  async remove_node({ name }: { name: string }): Promise<PromptNode> {
    return new PromptNode();
  }

  async find_node({ name }: { name: string }): Promise<PromptNode | null> {
    return null;
  }

  async to_json(): Promise<string> {
    return "";
  }

  async from_json({ jsonString }: { jsonString: string }): Promise<void> {
    return;
  }

  async to_text(): Promise<string> {
    return "";
  }
}
