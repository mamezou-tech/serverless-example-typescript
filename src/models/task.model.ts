import { v4 as UUID } from "uuid";

interface IProps {
  id?: string;
  listId: string;
  description: string;
  completed: boolean;
}

export interface ITaskInterface extends IProps {
  timestamp: number;
}

export default class TaskModel {
  private readonly _id: string;
  private _listId: string;
  private _description: string;
  private _completed: boolean;

  constructor({
    id = UUID(),
    listId,
    description = "",
    completed = false,
  }: IProps) {
    this._id = id;
    this._listId = listId;
    this._description = description;
    this._completed = completed;
  }

  get id(): string {
    return this._id;
  }

  set listId(value: string) {
    this._listId = value;
  }

  get listId(): string {
    return this._listId;
  }

  set description(value: string) {
    this._description = value;
  }

  get description(): string {
    return this._description;
  }

  set completed(value: boolean) {
    this._completed = value;
  }

  get completed(): boolean {
    return this._completed;
  }

  toEntityMapping(): ITaskInterface {
    return {
      id: this.id,
      listId: this.listId,
      description: this.description,
      completed: this.completed,
      timestamp: new Date().getTime(),
    };
  }
}
