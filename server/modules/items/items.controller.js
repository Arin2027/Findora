import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as itemsService from "./items.service.js";

export const createItem = asyncHandler(async (req, res) => {
  const item = await itemsService.createItem(req);
  return res.status(201).json(item);
});

export const listItems = asyncHandler(async (req, res) => {
  const result = await itemsService.listItems(req);
  return res.json(result);
});

export const listMyItems = asyncHandler(async (req, res) => {
  const result = await itemsService.listMyItems(req);
  return res.json(result);
});

export const getItem = asyncHandler(async (req, res) => {
  const item = await itemsService.getItem(req);
  return res.json(item);
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await itemsService.updateItem(req);
  return res.json(item);
});

export const deleteItem = asyncHandler(async (req, res) => {
  await itemsService.deleteItem(req);
  return ApiResponse.noContent(res);
});

export const listNearby = asyncHandler(async (req, res) => {
  const items = await itemsService.listNearby(req);
  return res.json(items);
});
