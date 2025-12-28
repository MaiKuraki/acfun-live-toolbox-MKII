import type { ApiContext } from "./context";
import type express from "express";
import type { NormalizedEventType } from "../../types";
import type { EventQuery } from "../../persistence/QueryService";
import * as fs from "fs";

export function registerEvents({ app, queryService, csvExporter }: ApiContext): void {
  app.get(
    "/api/events",
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const rawType = req.query.type as string | string[] | undefined;
        let typesArr: NormalizedEventType[] | undefined;
        if (Array.isArray(rawType)) {
          typesArr = (rawType as string[])
            .map((s) => String(s))
            .filter(Boolean) as NormalizedEventType[];
        } else if (typeof rawType === "string" && rawType.trim().length > 0) {
          typesArr = rawType
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean) as NormalizedEventType[];
        }

        const rawUserIds = req.query.user_ids as string | undefined;
        const idsArr = rawUserIds
          ? rawUserIds.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined;

        const query: EventQuery = {
          room_id: req.query.room_id as string,
          live_id: req.query.live_id as string,
          room_kw: req.query.room_kw as string,
          from_ts: req.query.from_ts ? parseInt(req.query.from_ts as string) : undefined,
          to_ts: req.query.to_ts ? parseInt(req.query.to_ts as string) : undefined,
          from_date: req.query.from_date ? String(req.query.from_date) : undefined,
          to_date: req.query.to_date ? String(req.query.to_date) : undefined,
          types: typesArr,
          user_id: req.query.user_id as string,
          user_ids: idsArr,
          user_kw: req.query.user_kw as string,
          q: req.query.q as string,
          page: req.query.page ? parseInt(req.query.page as string) : 1,
          pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : 200,
        };

        if (query.pageSize && (query.pageSize < 1 || query.pageSize > 1000)) {
          return res.status(400).json({ error: "Invalid pageSize. Must be between 1 and 1000." });
        }
        if (query.page && query.page < 1) {
          return res.status(400).json({ error: "Invalid page. Must be >= 1." });
        }

        const result = await queryService.queryEvents(query);
        if (process.env.ACFRAME_DEBUG_LOGS === "1") {
          try {
            console.log(
              "[API] /api/events params room_id=" + String(query.room_id || "") +
                " live_id=" + String(query.live_id || "") +
                " page=" + String(query.page) +
                " pageSize=" + String(query.pageSize) +
                " type=" + String((typesArr || []).join(",")) +
                " total=" + String(result.total) +
                " items=" + String(result.items.length)
            );
          } catch {}
        }
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  app.delete(
    "/api/events",
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const rawType = req.query.type as string | string[] | undefined;
        let typesArr: NormalizedEventType[] | undefined;
        if (Array.isArray(rawType)) {
          typesArr = (rawType as string[])
            .map((s) => String(s))
            .filter(Boolean) as NormalizedEventType[];
        } else if (typeof rawType === "string" && rawType.trim().length > 0) {
          typesArr = rawType
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean) as NormalizedEventType[];
        }

        const rawUserIds = req.query.user_ids as string | undefined;
        const idsArr = rawUserIds
          ? rawUserIds.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined;

        const query: EventQuery = {
          room_id: req.query.room_id as string,
          live_id: req.query.live_id as string,
          room_kw: req.query.room_kw as string,
          from_ts: req.query.from_ts ? parseInt(req.query.from_ts as string) : undefined,
          to_ts: req.query.to_ts ? parseInt(req.query.to_ts as string) : undefined,
          from_date: req.query.from_date ? String(req.query.from_date) : undefined,
          to_date: req.query.to_date ? String(req.query.to_date) : undefined,
          types: typesArr,
          user_id: req.query.user_id as string,
          user_ids: idsArr,
          user_kw: req.query.user_kw as string,
          q: req.query.q as string,
        };

        const deleted = await queryService.deleteEvents(query);
        if (process.env.ACFRAME_DEBUG_LOGS === "1") {
          try {
            console.log(
              "[API] DELETE /api/events params room_id=" + String(query.room_id || "") +
                " live_id=" + String(query.live_id || "") +
                " type=" + String((typesArr || []).join(",")) +
                " deleted=" + String(deleted)
            );
          } catch {}
        }
        res.json({ success: true, deleted });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    "/api/events/dates",
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const roomId = (req.query.room_id as string) || undefined;
        const dates = await queryService.getEventDates(roomId);
        return res.json({ dates });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    "/api/users",
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const limit = req.query.limit ? Math.max(1, Math.min(1000, parseInt(String(req.query.limit)))) : 200;
        const roomId = (req.query.room_id as string) || undefined;
        const items = await queryService.listUsers(limit, roomId);
        return res.json({ items, total: items.length });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    "/api/users/search",
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const keyword = String(req.query.keyword || "").trim();
        const page = req.query.page ? Math.max(1, parseInt(String(req.query.page))) : 1;
        const pageSize = req.query.pageSize ? Math.max(1, Math.min(200, parseInt(String(req.query.pageSize)))) : 20;
        const roomId = (req.query.room_id as string) || undefined;
        const result = await queryService.searchUsers(keyword, page, pageSize, roomId);
        return res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    "/api/stats/events",
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const roomId = (req.query.room_id as string) || undefined;
        const stats = await queryService.getEventStats(roomId);
        res.json({ success: true, ...stats });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    "/api/events/rooms",
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const limit = req.query.limit ? Math.max(1, Math.min(1000, parseInt(String(req.query.limit)))) : 200;
        const rooms = await queryService.listRooms(limit);
        if (process.env.ACFRAME_DEBUG_LOGS === "1") {
          try { console.log("[API] /api/events/rooms rooms=" + String(rooms.length)); } catch {}
        }
        res.json({ rooms });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    "/api/export",
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const rawType = req.query.type as string | string[] | undefined;
        let typesArr: NormalizedEventType[] | undefined;
        if (Array.isArray(rawType)) {
          typesArr = (rawType as string[])
            .map((s) => String(s).trim())
            .filter(Boolean) as NormalizedEventType[];
        } else if (typeof rawType === "string" && rawType.trim().length > 0) {
          typesArr = rawType
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean) as NormalizedEventType[];
        }

        const options = {
          room_id: req.query.room_id as string,
          from_ts: req.query.from_ts ? parseInt(String(req.query.from_ts)) : undefined,
          to_ts: req.query.to_ts ? parseInt(String(req.query.to_ts)) : undefined,
          from_date: req.query.from_date ? String(req.query.from_date) : undefined,
          to_date: req.query.to_date ? String(req.query.to_date) : undefined,
          types: typesArr,
          filename: req.query.filename as string,
          includeRaw: req.query.includeRaw === "true",
        } as any;

        const result = await csvExporter.exportToCsv(options);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
        res.setHeader("X-Record-Count", String(result.recordCount));
        const stream = fs.createReadStream(result.filepath, { encoding: "utf8" });
        stream.on("error", (err) => next(err));
        stream.pipe(res);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post(
    "/api/export",
    async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      try {
        const rawType = req.body?.type as string | string[] | undefined;
        const rawTypes = req.body?.types as string[] | undefined;
        let typesArr: NormalizedEventType[] | undefined;
        if (Array.isArray(rawTypes)) {
          typesArr = rawTypes.map((s) => String(s).trim()).filter(Boolean) as NormalizedEventType[];
        } else if (Array.isArray(rawType)) {
          typesArr = (rawType as string[]).map((s) => String(s).trim()).filter(Boolean) as NormalizedEventType[];
        } else if (typeof rawType === "string" && rawType.trim().length > 0) {
          typesArr = rawType.split(",").map((s) => s.trim()).filter(Boolean) as NormalizedEventType[];
        }

        const options = {
          room_id: req.body.room_id,
          from_ts: req.body.from_ts ? parseInt(String(req.body.from_ts)) : undefined,
          to_ts: req.body.to_ts ? parseInt(String(req.body.to_ts)) : undefined,
          from_date: req.body.from_date ? String(req.body.from_date) : undefined,
          to_date: req.body.to_date ? String(req.body.to_date) : undefined,
          types: typesArr,
          filename: req.body.filename,
          includeRaw: !!req.body.includeRaw,
        } as any;

        const result = await csvExporter.exportToCsv(options);
        res.json({ success: true, filename: result.filename, filepath: result.filepath, recordCount: result.recordCount, fileSize: result.fileSize });
      } catch (error) {
        next(error);
      }
    }
  );
}

