import { Vec2 } from "./../utils/lib.js"
import { Game } from "./../game.js"
import { PlayerEntity } from "./player.js"
import { CoinEntity } from "./coins.js"

export const Entities = {}

Entities.register = function() {
  Game.entities = {
      'player': { class: PlayerEntity, icon:{ texture:'entityIcons', pos:new Vec2(0,0), size:new Vec2(16,16) }},
      'coin': { class: CoinEntity, icon:{ texture:'entityIcons', pos:new Vec2(16,0), size:new Vec2(16,16) }},
    };
}
