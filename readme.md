This engine is all open source, feel free to take it, change it and use it as you wish. if you want, contact me, I'm a beginner in the world of rendering, so all suggestions are welcome. if this library was useful, please, consider making a donation. Thanks and good use.

## INTENTION

this engine is intended to be more like a library, very lightweight, without the use of any additional external libraries. Also, the engine's purpose is to be beginner friendly, something like **microsoft make code arcade** ([see here](https://arcade.makecode.com/)). This document is intended to be either a documentation and a sort of book of journeys, for the once who wants to learn how to program an engine, from how webgl and webgpu works to the game algorithms.

# RENDERER

## NEXT STEPS

- [ ] webgpu texture
- [ ] webgpu uniforms
- [ ] re-implement the WebGL renderer
- [ ] implement lights 
- [ ] implement skeletal animations
- [ ] implement a fallback system with possibility of require specific api for the renderer

## MATERIAL FOR GETTING STARTED 

this material is intended to be the absolute starting point for the once that have never touched rendering before. i will collect all the material that I'm currently using to study here.


## INDEX
- [how it works](#how-it-works)
- [rendering pipeline](#rendering-pipeline)

## HOW IT WORKS

the fist step is to understand how webgl and webgpu works. Either the api's are very different from each other, in fact, webgl works as linear as possible, making it very easy to understand for beginners. in the other hand, webgpu use the rendering pipeline, that optimize the rendering phase a lot, but make it more difficult to understand, for the once who comes from an high level language, such as javascript.

### RENDERING PIPELINE

 In order to understand the rendering pipeline, i will explain how it works: fist, the pipeline is filled with commands that can be executed by the gpu. when the gpu receives the commands, it executes them, as queue, making the execution very efficient. To more easy understand this concept , let's try to understand also webgl api's: Webgl send the commands once each, so the gpu will act as a sort of bodyguard, that prevents other programs to be run in row, as you can see in the following example: <br><br> ![plot](./pipeline.jpg)<br><br>At the end of the execution, that data will be understood by the gpu only as an image, without depth (no more depth test), so, if you want to make more objects interact between each others, you have to draw them in the same pipeline.

### WebGL
[-WebGL Fundamentals](https://webglfundamentals.org/)\
[-Mozilla docs](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Getting_started_with_WebGL)

### WebGPU
[-WebGPU Step By Step](https://github.com/jack1232/WebGPU-Step-By-Step)\
[-Raw WebGPU](https://alain.xyz/blog/raw-webgpu)\
[-code labs google tutorial](https://codelabs.developers.google.com/your-first-webgpu-app#6)\
[-Mozilla docs](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)\
[-WebGPU Fundamentals](https://webgpufundamentals.org/)

### VARIOUS RENDERING TECHNIQUES

[-Skeletal Animation](https://veeenu.github.io/blog/implementing-skeletal-animation/)\
[-WebGPU API for C++](https://eliemichel.github.io/LearnWebGPU/introduction.html)\
[-WebGPU for Metal developers](https://metalbyexample.com/webgpu-part-two/)\
[-Render grass](https://www.youtube.com/watch?v=bp7REZBV4P4&t=401s)

