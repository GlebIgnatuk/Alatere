import { Request, Response } from 'express'

export class HealthController {
  static getHealth = async (req: Request, res: Response) => {
    res.status(200).json({ success: true, data: { ok: true } })
  }
}
