import { Request, Response } from 'express'

export class IndexController {
  static getIndex = async (req: Request, res: Response) => {
    res.status(200).json({ success: true, data: { ok: true } })
  }
}
