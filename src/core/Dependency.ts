import Item from "./Item";

/**
 * Dependency is a data structure to define parsed dependency index, versions and error
 */
export default interface Dependency {
  item: Item;
  versions?: Array<string>;
  error?: string;
}
