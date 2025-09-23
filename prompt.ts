import { wrapper } from "./decorators.ts";

@wrapper
export class PromptNode {
  items: string[] = [];
  children: PromptNode[] = [];

  constructor(public name: string) {}

  add_item({ item }: { item: string | string[] }): Promise<PromptNode> {
    if (Array.isArray(item)) {
      this.items = this.items.concat(item);
    } else {
      this.items.push(item);
    }
    return Promise.resolve(this);
  }

  remove_item({ item }: { item: string }): Promise<PromptNode> {
    this.items = this.items.filter((i) => i !== item);
    return Promise.resolve(this);
  }

  clear_items(): Promise<PromptNode> {
    this.items = [];
    return Promise.resolve(this);
  }

  add_node({ name }: { name: string }): Promise<PromptNode> {
    const node = new PromptNode(name);
    this.children.push(node);
    return Promise.resolve(node);
  }

  node({ name }: { name: string }): Promise<PromptNode> {
    const existingNode = this.children.find((n) => n.name === name);
    if (!existingNode) {
      const newNode = new PromptNode(name);
      this.children.push(newNode);
      return Promise.resolve(newNode);
    }
    return Promise.resolve(existingNode);
  }

  remove_node({ name }: { name: string }): Promise<PromptNode> {
    this.children = this.children.filter((n) => n.name !== name);
    return Promise.resolve(this);
  }

  find_node({ name }: { name: string }): Promise<PromptNode | null> {
    return Promise.resolve(this.children.find((n) => n.name === name) ?? null);
  }

  to_json(): Promise<string> {
    return Promise.resolve(JSON.stringify(this));
  }

  from_json({ jsonString }: { jsonString: string }): Promise<void> {
    return Promise.resolve();
  }

  to_text(): Promise<string> {
    const formatNode = (node: PromptNode, depth: number): string => {
      const indent = "\t".repeat(depth);
      let result = `${indent}<${node.name}>\n`;
      for (const item of node.items) {
        result += `${indent}\t${item}\n`;
      }
      for (const child of node.children) {
        result += formatNode(child, depth + 1);
      }
      result += `${indent}</${node.name}>\n`;
      return result;
    };
    return Promise.resolve(formatNode(this, 0));
  }
}
