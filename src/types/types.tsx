export interface CardData {
    id: number
    url: string
    name: string
    x: number
    y: number
    locked: boolean
    tapped: boolean
}

export interface IDeckInfo {
    deckName: string;
    cardCount: number
    deckListIndex: number;
    date: string;
}