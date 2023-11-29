export type EventHandler = (e: { [key: string]: any;})=>void;
export namespace EventEmitter {
      const events = new Map<string, EventHandler[]>();

      export enum ARROWS {
            UP = 'ArrowUp',
            DOWN = 'ArrowDown',
            LEFT = 'ArrowLeft',
            RIGHT = 'ArrowRight',
      }
      export const KEY_UP = 'KeyUp';
      
      export function fire( name: string, message: { [key: string]: any;} ){
            const handlers = events.get(name);
            if( !handlers || handlers.length <= 0 )
                  return;
            handlers.forEach( handler => handler( message ) );
      }
      export function on( name: string, handler: EventHandler ){
            const handlers = events.get(name);
            if( handlers )
                  handlers.push( handler );
            else 
                  events.set( name, [ handler ] );
      }
      export function remove( name: string, handler: EventHandler ){
            const handlers = events.get(name);
            if( !handlers || handlers.length <= 0 )
                  return;
            handlers.every( (elem, index)=> {
                  if( handler.toString() == elem.toString() ){
                        handlers.splice(index, 1);
                        return true;
                  }
                  return false;
            })
      }
      export function deleteEvent( name: string ){
            if( events.has( name ) )
                  events.delete( name );
      }
      export function onArrowUpPressed( handler: EventHandler ){
            on( ARROWS.UP , handler );
      }
      export function onArrowDownPressed( handler: EventHandler ){
            on( ARROWS.DOWN , handler );
      }
      export function onArrowLeftPressed( handler: EventHandler ){
            on( ARROWS.LEFT , handler );
      }
      export function onArrowRightPressed( handler: EventHandler ){
            on( ARROWS.RIGHT , handler );
      }
      export function onKeyRelease( handler: EventHandler ){
            on( KEY_UP, handler );
      }
}