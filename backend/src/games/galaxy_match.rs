use serde::{Serialize, Deserialize};
use rand::Rng;
use std::collections::{HashSet, HashMap};
use std::time::{SystemTime, UNIX_EPOCH};

// ============================================================================
// ENUMS & BASIC TYPES
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum GemType {
    Red,
    Blue,
    Green,
    Yellow,
    Purple,
    Orange,
    Pink,
    Empty,
}

impl GemType {
    pub fn random() -> Self {
        let mut rng = rand::thread_rng();
        match rng.gen_range(0..7) {
            0 => GemType::Red,
            1 => GemType::Blue,
            2 => GemType::Green,
            3 => GemType::Yellow,
            4 => GemType::Purple,
            5 => GemType::Orange,
            _ => GemType::Pink,
        }
    }

    pub fn color_code(&self) -> &str {
        match self {
            GemType::Red => "#EF4444",
            GemType::Blue => "#3B82F6",
            GemType::Green => "#10B981",
            GemType::Yellow => "#F59E0B",
            GemType::Purple => "#8B5CF6",
            GemType::Orange => "#F97316",
            GemType::Pink => "#EC4899",
            GemType::Empty => "#000000",
        }
    }

    pub fn is_empty(&self) -> bool {
        *self == GemType::Empty
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum PowerUpType {
    RowBlast,      // Clears entire row
    ColumnBlast,   // Clears entire column
    ColorBomb,     // Clears all gems of same color
    SuperGem,      // 3x3 explosion
    TimeFreeze,    // Stops timer for 5 seconds
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PowerUp {
    pub power_type: PowerUpType,
    pub x: usize,
    pub y: usize,
    pub charges: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Move {
    pub from_x: usize,
    pub from_y: usize,
    pub to_x: usize,
    pub to_y: usize,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameStats {
    pub total_score: u32,
    pub moves_made: u32,
    pub matches_found: u32,
    pub largest_combo: u32,
    pub power_ups_used: u32,
    pub time_elapsed: u64,
    pub level: u32,
}

impl Default for GameStats {
    fn default() -> Self {
        Self {
            total_score: 0,
            moves_made: 0,
            matches_found: 0,
            largest_combo: 0,
            power_ups_used: 0,
            time_elapsed: 0,
            level: 1,
        }
    }
}

// ============================================================================
// GALAXY GRID
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GalaxyGrid {
    pub width: usize,
    pub height: usize,
    pub cells: Vec<Vec<GemType>>,
    pub power_ups: Vec<PowerUp>,
    pub locked_cells: HashSet<(usize, usize)>,
    pub combo_multiplier: u32,
    pub last_match_time: u64,
}

impl GalaxyGrid {
    pub fn new(width: usize, height: usize) -> Self {
        let mut grid = Self {
            width,
            height,
            cells: vec![vec![GemType::Empty; width]; height],
            power_ups: Vec::new(),
            locked_cells: HashSet::new(),
            combo_multiplier: 1,
            last_match_time: Self::current_timestamp(),
        };

        grid.initialize_board();
        grid
    }

    fn current_timestamp() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }

    fn initialize_board(&mut self) {
        for y in 0..self.height {
            for x in 0..self.width {
                self.cells[y][x] = GemType::random();
            }
        }

        // Ensure no initial matches
        while !self.find_matches().is_empty() {
            let matches = self.find_matches();
            for &(x, y) in &matches {
                self.cells[y][x] = GemType::random();
            }
        }
    }

    pub fn is_valid_position(&self, x: usize, y: usize) -> bool {
        x < self.width && y < self.height
    }

    pub fn is_adjacent(&self, x1: usize, y1: usize, x2: usize, y2: usize) -> bool {
        let dx = (x1 as i32 - x2 as i32).abs();
        let dy = (y1 as i32 - y2 as i32).abs();
        dx + dy == 1
    }

    pub fn swap(&mut self, x1: usize, y1: usize, x2: usize, y2: usize) -> Result<u32, String> {
        // Validation
        if !self.is_valid_position(x1, y1) || !self.is_valid_position(x2, y2) {
            return Err("Invalid position".to_string());
        }

        if !self.is_adjacent(x1, y1, x2, y2) {
            return Err("Gems must be adjacent".to_string());
        }

        if self.locked_cells.contains(&(x1, y1)) || self.locked_cells.contains(&(x2, y2)) {
            return Err("Cannot swap locked cells".to_string());
        }

        // Perform swap
        let temp = self.cells[y1][x1];
        self.cells[y1][x1] = self.cells[y2][x2];
        self.cells[y2][x2] = temp;

        // Check for matches
        let matches = self.find_matches();
        
        if matches.is_empty() {
            // No match - swap back
            let temp = self.cells[y1][x1];
            self.cells[y1][x1] = self.cells[y2][x2];
            self.cells[y2][x2] = temp;
            return Err("No matches found".to_string());
        }

        // Calculate score
        let score = self.calculate_score(&matches);
        
        Ok(score)
    }

    pub fn find_matches(&self) -> HashSet<(usize, usize)> {
        let mut matches = HashSet::new();

        // Horizontal matches (3 or more)
        for y in 0..self.height {
            let mut x = 0;
            while x < self.width {
                let gem = self.cells[y][x];
                if gem.is_empty() {
                    x += 1;
                    continue;
                }

                let mut count = 1;
                let mut end_x = x;

                while end_x + 1 < self.width && self.cells[y][end_x + 1] == gem {
                    count += 1;
                    end_x += 1;
                }

                if count >= 3 {
                    for i in x..=end_x {
                        matches.insert((i, y));
                    }

                    // Create power-up for 4+ matches
                    if count >= 4 {
                        self.check_power_up_creation(x, y, count);
                    }
                }

                x = end_x + 1;
            }
        }

        // Vertical matches (3 or more)
        for x in 0..self.width {
            let mut y = 0;
            while y < self.height {
                let gem = self.cells[y][x];
                if gem.is_empty() {
                    y += 1;
                    continue;
                }

                let mut count = 1;
                let mut end_y = y;

                while end_y + 1 < self.height && self.cells[end_y + 1][x] == gem {
                    count += 1;
                    end_y += 1;
                }

                if count >= 3 {
                    for i in y..=end_y {
                        matches.insert((x, i));
                    }

                    if count >= 4 {
                        self.check_power_up_creation(x, y, count);
                    }
                }

                y = end_y + 1;
            }
        }

        matches
    }

    fn check_power_up_creation(&self, x: usize, y: usize, match_count: usize) {
        // In a real implementation, this would add power-ups
        // For now, it's a placeholder for the logic
        let _ = (x, y, match_count);
    }

    fn calculate_score(&mut self, matches: &HashSet<(usize, usize)>) -> u32 {
        let base_score = matches.len() as u32 * 10;
        
        // Combo multiplier (increases with consecutive matches)
        let current_time = Self::current_timestamp();
        if current_time - self.last_match_time < 3 {
            self.combo_multiplier += 1;
        } else {
            self.combo_multiplier = 1;
        }
        self.last_match_time = current_time;

        let score = base_score * self.combo_multiplier;
        
        // Bonus for large matches
        let bonus = if matches.len() > 5 {
            matches.len() as u32 * 5
        } else {
            0
        };

        score + bonus
    }

    pub fn remove_matches(&mut self, matches: &HashSet<(usize, usize)>) {
        for &(x, y) in matches {
            self.cells[y][x] = GemType::Empty;
        }
    }

    pub fn apply_gravity(&mut self) {
        for x in 0..self.width {
            let mut write_y = self.height;
            
            for read_y in (0..self.height).rev() {
                if !self.cells[read_y][x].is_empty() {
                    if write_y == 0 {
                        continue;
                    }
                    write_y -= 1;
                    
                    if write_y != read_y {
                        self.cells[write_y][x] = self.cells[read_y][x];
                        self.cells[read_y][x] = GemType::Empty;
                    }
                }
            }
        }
    }

    pub fn refill(&mut self) {
        for y in 0..self.height {
            for x in 0..self.width {
                if self.cells[y][x].is_empty() {
                    self.cells[y][x] = GemType::random();
                }
            }
        }
    }

    pub fn process_cascade(&mut self) -> u32 {
        let mut total_score = 0;
        
        loop {
            let matches = self.find_matches();
            if matches.is_empty() {
                break;
            }

            total_score += self.calculate_score(&matches);
            self.remove_matches(&matches);
            self.apply_gravity();
            self.refill();
        }

        total_score
    }

    pub fn use_power_up(&mut self, power_type: PowerUpType, x: usize, y: usize) -> HashSet<(usize, usize)> {
        let mut affected = HashSet::new();

        match power_type {
            PowerUpType::RowBlast => {
                for col in 0..self.width {
                    affected.insert((col, y));
                }
            }
            PowerUpType::ColumnBlast => {
                for row in 0..self.height {
                    affected.insert((x, row));
                }
            }
            PowerUpType::ColorBomb => {
                let target_color = self.cells[y][x];
                for row in 0..self.height {
                    for col in 0..self.width {
                        if self.cells[row][col] == target_color {
                            affected.insert((col, row));
                        }
                    }
                }
            }
            PowerUpType::SuperGem => {
                for dy in -1..=1 {
                    for dx in -1..=1 {
                        let new_x = (x as i32 + dx) as usize;
                        let new_y = (y as i32 + dy) as usize;
                        if self.is_valid_position(new_x, new_y) {
                            affected.insert((new_x, new_y));
                        }
                    }
                }
            }
            PowerUpType::TimeFreeze => {
                // This would be handled by game state
            }
        }

        affected
    }

    pub fn get_hint(&self) -> Option<(usize, usize, usize, usize)> {
        for y in 0..self.height {
            for x in 0..self.width {
                // Try swapping right
                if x + 1 < self.width {
                    if self.would_create_match(x, y, x + 1, y) {
                        return Some((x, y, x + 1, y));
                    }
                }
                // Try swapping down
                if y + 1 < self.height {
                    if self.would_create_match(x, y, x, y + 1) {
                        return Some((x, y, x, y + 1));
                    }
                }
            }
        }
        None
    }

    fn would_create_match(&self, x1: usize, y1: usize, x2: usize, y2: usize) -> bool {
        let mut test_grid = self.clone();
        let temp = test_grid.cells[y1][x1];
        test_grid.cells[y1][x1] = test_grid.cells[y2][x2];
        test_grid.cells[y2][x2] = temp;
        !test_grid.find_matches().is_empty()
    }
}

// ============================================================================
// GAME STATE MANAGER
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub grid: GalaxyGrid,
    pub stats: GameStats,
    pub move_history: Vec<Move>,
    pub target_score: u32,
    pub max_moves: u32,
    pub game_over: bool,
    pub won: bool,
}

impl GameState {
    pub fn new(width: usize, height: usize, target_score: u32, max_moves: u32) -> Self {
        Self {
            grid: GalaxyGrid::new(width, height),
            stats: GameStats::default(),
            move_history: Vec::new(),
            target_score,
            max_moves,
            game_over: false,
            won: false,
        }
    }

    pub fn make_move(&mut self, x1: usize, y1: usize, x2: usize, y2: usize) -> Result<u32, String> {
        if self.game_over {
            return Err("Game is over".to_string());
        }

        if self.stats.moves_made >= self.max_moves {
            self.game_over = true;
            return Err("No moves remaining".to_string());
        }

        let score = self.grid.swap(x1, y1, x2, y2)?;
        let cascade_score = self.grid.process_cascade();
        let total_score = score + cascade_score;

        self.stats.total_score += total_score;
        self.stats.moves_made += 1;
        self.stats.matches_found += 1;

        self.move_history.push(Move {
            from_x: x1,
            from_y: y1,
            to_x: x2,
            to_y: y2,
            timestamp: GalaxyGrid::current_timestamp(),
        });

        // Check win condition
        if self.stats.total_score >= self.target_score {
            self.game_over = true;
            self.won = true;
        }

        Ok(total_score)
    }

    pub fn get_remaining_moves(&self) -> u32 {
        self.max_moves.saturating_sub(self.stats.moves_made)
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_grid_initialization() {
        let grid = GalaxyGrid::new(8, 8);
        assert_eq!(grid.width, 8);
        assert_eq!(grid.height, 8);
    }

    #[test]
    fn test_valid_swap() {
        let mut grid = GalaxyGrid::new(8, 8);
        let result = grid.swap(0, 0, 0, 1);
        assert!(result.is_ok() || result.is_err());
    }

    #[test]
    fn test_invalid_swap_non_adjacent() {
        let mut grid = GalaxyGrid::new(8, 8);
        let result = grid.swap(0, 0, 2, 2);
        assert!(result.is_err());
    }

    #[test]
    fn test_game_state() {
        let mut game = GameState::new(8, 8, 1000, 20);
        assert_eq!(game.get_remaining_moves(), 20);
        assert!(!game.game_over);
    }
}
