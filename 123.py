import asyncio
from asyncio import FIRST_COMPLETED


async def greating():
    await asyncio.sleep(1)

    print('HELLOOOO')

async def greating1():
    await asyncio.sleep(3)
    raise
    print('HELLOOOO3')


async def main():
    x = await asyncio.gather(greating(), greating1(),return_exceptions=True)
    print(x)


asyncio.run(main())