<?php
namespace App\Security;

use App\Entity\User;
use App\Security\Exception\AccountDisabledException;
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;

/**
 * Class UserChecker
 */
class UserChecker implements UserCheckerInterface
{
    /**
     * @param User|UserInterface $user
     */
    public function checkPreAuth(UserInterface $user)
    {
        if (!$user instanceof User) {
            return;
        }

        if (!$user->isEnabled()) {
            throw new AccountDisabledException('Account disabled.');
        }
    }

    /**
     * {@inheritDoc}
     */
    public function checkPostAuth(UserInterface $user)
    {
        // TODO: Implement checkPostAuth() method.
    }
}
