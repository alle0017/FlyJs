import { LoopController, LoopedFunction } from './loopController.js';
import { DrawOpt, Point3D, Renderable, Axis, } from '../rendering/types.js';
import { EventEmitter, EventHandler } from './eventController.js';
import { GameController } from './gameController.js';
import { isEntity, Entity } from '../entities/entity.js';
import { Camera } from '../rendering/matrix/camera.js';



export class Scene {
      private static SCENE_ID = 0;
      protected id: number;
      protected objects: Map<string,Renderable | Entity> = new Map<string,Renderable | Entity>();
      private functions: LoopedFunction[] = [];
      private appended: boolean = false;
      protected readonly $game;

      private _useCamera: boolean = false;
      private _camera?: Camera;

      get useCamera(): boolean {
            return this._useCamera;
      }
      set useCamera( value: boolean ){
            if( this._useCamera === value ) 
                  return;
            this._useCamera = value;
            if( !this._useCamera ){
                  this._camera = undefined;
                  this.$game.renderer.setToAll({ camera: undefined });
            }else{
                  this._camera = new Camera();
                  this.$game.renderer.setToAll({ camera: this._camera });
            }
      }
      get cameraPosition(){
            return this._camera?.position || { x: 0, y: 0, z: 0 };
      }
      set cameraPosition( position: Point3D ){
            if( !this._camera ){
                  console.warn('no camera available');
                  return;
            }
            this._camera.position = position;
            this.setCameraToAll();
      }


      constructor( game: GameController ){
            this.id = Scene.SCENE_ID;
            Scene.SCENE_ID++;
            this.$game = game;
      }
      private appendRenderable( key: string, object: Renderable ){
            this.$game.renderer.append( key, object )
      }
      private appendEntity( object: Entity ){
            object.onEnter();
            this.$game.renderer.append( object.id, object.renderable ) 
            object.appended = true;
      }
      private setCameraToAll(){
            if( this.appended ){
                 this.$game.renderer.setToAll({ camera: this._camera });
            }else{
                  this.objects.forEach( obj =>{
                        if( obj instanceof Entity ){
                              obj.renderable.attributes.camera = this._camera;
                        }else{
                              obj.attributes.camera = this._camera;
                        }
                  })
            }
      }
      use(){
            this.appended = true;
            EventEmitter.fire( `scene_${this.id}_enter`, { game: this.$game } );
            this.objects.forEach( (object,key)=>{ 
                  if( isEntity( object ) ){
                        this.appendEntity( object )
                  }else{
                        this.appendRenderable( key, object );
                  }
            });
            this.functions.forEach( fn => this.$game.loopController.add( fn ) );
      }
      dismiss(){
            this.appended = false;
            EventEmitter.fire( `scene_${this.id}_dismiss`, { game: this.$game } );
            this.objects.forEach( object => { 
                  if( isEntity(object) ){
                        object.appended = false;
                        object.onDismiss();
                  }
            });
      }
      attach( name: string, object: Renderable, attributes?: DrawOpt ): void;
      attach( entity: Entity, attributes?: DrawOpt ): void;
      attach( arg0: any, arg1: any, arg2?: any ){
            if( typeof arg0 !== 'string' ){
                  this.objects.set( arg0.id, arg0 );
                  if( arg1 )
                        arg0.renderable.attributes = arg1;
                  arg0.renderable.attributes = {
                        ...arg0.renderable.attributes,
                        camera: this._camera
                  }
                  this.execute( (arg0.onDraw).bind(arg0) )
            }
            else{
                  this.objects.set( arg0, arg1 );
                  if( arg2 )
                        arg1.attributes = arg2;
                  arg1.attributes = {
                        ...arg1.attributes,
                        camera: this._camera
                  }
            }
            if( !this.appended ) return;
            if( typeof arg0 !== 'string' ){
                  this.appendEntity( arg0 ); 
            }else{
                  this.appendRenderable( arg0, arg1 );
            }

      }
      execute( fn: LoopedFunction ){
            this.functions.push( fn );
      }
      onEnter( func: EventHandler ){
            EventEmitter.on( `scene_${this.id}_enter`, func );
      }
      onDismiss( func: EventHandler ){
            EventEmitter.on( `scene_${this.id}_dismiss`, func );
      }
      setCameraAngle( angle: number, axis: Axis = Axis.X ){

            if( !this._camera ){
                  console.warn('no camera available');
                  return;
            }
            this._camera.rotationAxis = axis;
            this._camera.angle = angle;
            this.setCameraToAll();
      }
      attachCameraToEntity( entity: Entity ){
            if( !this._camera ){
                  this._camera = new Camera();
                  this.setCameraToAll();
            }
            entity.camera = this._camera;
      }
      detachCameraFromEntity( entity: Entity ){
            if( !this._camera )
                  return;
            entity.camera = undefined;
            this._camera = undefined;
            this.setCameraToAll();
      }
      useGlobalCamera(){
            if( this._camera )
                  return;
            this._camera = new Camera();
            this.setCameraToAll();
      }
      detachGlobalCamera(){
            if( !this._camera )
                  return;
            this._camera = undefined;
            this.setCameraToAll();
      }

}