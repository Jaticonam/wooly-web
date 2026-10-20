import{
 useState,
 useEffect
}
from"react";

export function
useProductViewers(){

 const[
 viewers,
 setViewers
 ]=

 useState(

 Math.floor(
 Math.random()*8
 )+6

 );

 useEffect(()=>{

 const interval=

 setInterval(()=>{

 setViewers(

 Math.floor(
 Math.random()*8
 )+6

 );

 },7000);

 return()=>{

 clearInterval(
 interval
 );

 };

 },[]);

 return viewers;

}
