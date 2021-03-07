import {v4 as UUID} from "uuid";

interface IProps {
  id?: string;
  name: string;
}

interface IListInterface extends IProps {
  timestamp: number;
}

export default class ListModel {
  private _id: string;
  private _name: string;

  constructor({id = UUID(), name = ""}: IProps) {
    this._id = id;
    this._name = name;
  }

  set id(value: string) {
    this._id = value !== "" ? value: null;
  }

  get id(): string {
    return this._id;
  }

  set name(value: string) {
    this._name = value;
  }

  get name(): string {
    return this._name;
  }

  toEntityMappings(): IListInterface {
    return {
      id: this.id,
      name: this.name,
      timestamp: new Date().getTime(),
    };
  }
}